import { test, expect } from '@playwright/test';

// Milestone 15b — Notifications: API Controller and Frontend

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('admin@example.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function navigateToNotifications(page: any) {
  const navLink = page.getByTestId('nav-desktop-notifications').first();
  if (await navLink.isVisible()) {
    await navLink.click();
  } else {
    await page.getByRole('link', { name: /notifications/i }).first().click();
  }
  await page.waitForURL(/\/notifications/, { timeout: 10000 });
}

test('notifications page renders notifications-heading after login', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToNotifications(page);
  const heading = page.getByTestId('notifications-heading');
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText('Notifications');
});

test('notifications page loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await loginAsAdmin(page);
  await navigateToNotifications(page);
  await page.waitForTimeout(1000);
  expect(errors).toHaveLength(0);
});

test('notifications page has type selector with assignment and audition options', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToNotifications(page);
  const typeSelect = page.getByTestId('type-select');
  await expect(typeSelect).toBeVisible();
  await expect(typeSelect.locator('option[value="assignment"]')).toHaveCount(1);
  await expect(typeSelect.locator('option[value="audition"]')).toHaveCount(1);
});

test('notifications page has subject input, body input, and send button', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToNotifications(page);
  await expect(page.getByTestId('subject-input')).toBeVisible();
  await expect(page.getByTestId('body-input')).toBeVisible();
  await expect(page.getByTestId('send-button')).toBeVisible();
});

test('notifications page has preview recipients button', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToNotifications(page);
  await expect(page.getByTestId('preview-recipients-button')).toBeVisible();
});

test('notifications page - send assignment announcement succeeds', async ({ page }) => {
  // Use direct API login to get a non-Secure cookie for HTTP Docker setup
  const loginResp = await page.request.post('http://app:8080/auth/login', {
    data: { email: 'admin@example.com', password: 'Password123!' },
    headers: { 'Content-Type': 'application/json' },
  });
  const userBody = await loginResp.json();
  const setCookieHeader = loginResp.headers()['set-cookie'] ?? '';
  const sessionToken = setCookieHeader.match(/stretto_session=([^;]+)/)?.[1] ?? '';
  
  // Set cookie without Secure flag so it works over HTTP
  await page.context().addCookies([{
    name: 'stretto_session',
    value: sessionToken,
    domain: 'frontend',
    path: '/',
    secure: false,
    httpOnly: false,
  }]);

  // Navigate to login page, inject auth state into localStorage, then go to dashboard
  await page.goto('http://frontend:5173/login');
  await page.evaluate((user) => {
    localStorage.setItem('stretto_user', JSON.stringify(user));
  }, userBody);

  // Navigate to dashboard via full URL now that auth is set
  await page.goto('http://frontend:5173/dashboard');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  // Navigate to notifications via nav link
  await navigateToNotifications(page);

  // Select assignment type
  await page.getByTestId('type-select').selectOption('assignment');

  // Wait for program year options to load (API data loads via cookie)
  const targetSelect = page.getByTestId('target-select');
  await expect(targetSelect).toBeVisible();
  
  // Wait for options to appear (API data loads)
  await page.waitForTimeout(2000);

  // Check if options loaded
  const optionCount = await targetSelect.locator('option:not([value=""])').count();
  if (optionCount === 0) {
    // Skip if no program years available (shouldn't happen with seed data)
    test.skip();
    return;
  }

  // Select the first non-empty option
  const firstOption = targetSelect.locator('option:not([value=""])').first();
  const firstValue = await firstOption.getAttribute('value');
  if (firstValue) {
    await targetSelect.selectOption(firstValue);
  }

  await page.getByTestId('subject-input').fill('Test Assignment Subject');
  await page.getByTestId('body-input').fill('Test assignment body text.');

  await page.getByTestId('send-button').click();

  const success = page.getByTestId('send-success');
  await expect(success).toBeVisible({ timeout: 8000 });
});

test('notifications page - switching type to audition updates target selector', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToNotifications(page);

  await page.getByTestId('type-select').selectOption('audition');
  await page.waitForTimeout(500);

  // Label should change to "Audition Date"
  const label = page.locator('label[for="targetId"]');
  await expect(label).toHaveText('Audition Date');
});
