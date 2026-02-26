import { test, expect } from '@playwright/test';

// Milestone 04a — Program Years API
// J-1: Smoke — Login and Navigate the App Shell

const ADMIN_EMAIL = 'admin@example.com';

test.describe('J-1: Smoke — Login and Navigate the App Shell', () => {
  test('unauthenticated root redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login with admin email redirects to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('sidebar shows organization name "My Choir" after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('login-button').click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('My Choir').first()).toBeVisible();
  });

  test('sidebar shows Program Years nav link', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('login-button').click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    const navLink = page.getByTestId('nav-program-years').first();
    await expect(navLink).toBeVisible();
  });

  test('all admin nav links are visible in sidebar', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('login-button').click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    const navItems = ['dashboard', 'program-years', 'members', 'venues'];
    for (const item of navItems) {
      const link = page.getByTestId(`nav-${item}`).first();
      await expect(link).toBeVisible();
    }
  });

  test('clicking Program Years nav link loads without JS error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('login-button').click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    const navLink = page.getByTestId('nav-program-years').first();
    await navLink.click();
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('user name and role appear at bottom of sidebar', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('login-button').click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // User's name or "Admin" role should appear somewhere in sidebar
    const adminText = page.getByText('Admin').first();
    await expect(adminText).toBeVisible();
  });

  test('GET /health returns 200 (via API)', async ({ request }) => {
    const response = await request.get('http://app:8080/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });
});
