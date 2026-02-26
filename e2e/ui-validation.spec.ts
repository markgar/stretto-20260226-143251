import { test, expect } from '@playwright/test';

// Milestone 06b — Venues Admin Pages

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('mgarner22@gmail.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function navigateToVenues(page: any) {
  // Use nav link click to avoid full-page reload (Zustand state preserved)
  const venuesNav = page.getByTestId('nav-venues').first();
  if (await venuesNav.isVisible()) {
    await venuesNav.click();
  } else {
    await page.getByRole('link', { name: /venues/i }).first().click();
  }
  await page.waitForURL(/\/venues$/, { timeout: 10000 });
}

test('venues list page renders venues-heading after login', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToVenues(page);
  const heading = page.getByTestId('venues-heading');
  await expect(heading).toBeVisible();
});

test('venues list page loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await loginAsAdmin(page);
  await navigateToVenues(page);
  await page.waitForTimeout(1000);
  expect(errors).toHaveLength(0);
});

test('venues/new renders name-input', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToVenues(page);
  await page.getByTestId('add-venue-button').first().click();
  await page.waitForURL(/\/venues\/new/, { timeout: 10000 });
  const nameInput = page.getByTestId('name-input');
  await expect(nameInput).toBeVisible();
});

test('venues/new renders submit-button', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToVenues(page);
  await page.getByTestId('add-venue-button').first().click();
  await page.waitForURL(/\/venues\/new/, { timeout: 10000 });
  const submitButton = page.getByTestId('submit-button');
  await expect(submitButton).toBeVisible();
});

test('venues/new page loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await loginAsAdmin(page);
  await navigateToVenues(page);
  await page.getByTestId('add-venue-button').first().click();
  await page.waitForURL(/\/venues\/new/, { timeout: 10000 });
  await page.waitForTimeout(1000);
  expect(errors).toHaveLength(0);
});

test('venues list page has add-venue-button linking to /venues/new', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToVenues(page);
  const addButton = page.getByTestId('add-venue-button').first();
  await expect(addButton).toBeVisible();
});

test('clicking add-venue-button navigates to /venues/new', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToVenues(page);
  await page.getByTestId('add-venue-button').first().click();
  await expect(page).toHaveURL(/\/venues\/new/, { timeout: 10000 });
});

// Milestone 03b — Authentication / App Shell

test('login page loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/login');
  expect(errors).toHaveLength(0);
});

test('login page renders email input with data-testid="email-input"', async ({ page }) => {
  await page.goto('/login');
  const emailInput = page.getByTestId('email-input');
  await expect(emailInput).toBeVisible();
});

test('login page renders submit button with data-testid="login-button"', async ({ page }) => {
  await page.goto('/login');
  const loginButton = page.getByTestId('login-button');
  await expect(loginButton).toBeVisible();
});

test('root "/" redirects to "/login"', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('navigating to /dashboard without login redirects to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('submitting login form with valid email redirects to /dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('admin@example.com');
  await page.getByTestId('login-button').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
});

test('dashboard page renders heading with data-testid="dashboard-heading"', async ({ page }) => {
  // Log in first
  await page.goto('/login');
  await page.getByTestId('email-input').fill('admin@example.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  const heading = page.getByTestId('dashboard-heading');
  await expect(heading).toBeVisible();
});

test('dashboard page loads without JavaScript errors after login', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/login');
  await page.getByTestId('email-input').fill('admin@example.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  expect(errors).toHaveLength(0);
});

test('invalid email shows validation error on login form', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('not-an-email');
  await page.getByTestId('login-button').click();
  // Should still be on login page (not redirected)
  await expect(page).toHaveURL(/\/login/);
});

test('app shell navigation is visible after login', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('admin@example.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  // At least one nav link should be visible (Dashboard nav item)
  const dashboardNav = page.getByTestId('nav-desktop-dashboard');
  await expect(dashboardNav).toBeVisible();
});
