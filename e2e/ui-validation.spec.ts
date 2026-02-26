import { test, expect } from '@playwright/test';

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
  await page.getByTestId('email-input').fill('mgarner22@gmail.com');
  await page.getByTestId('login-button').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
});

test('dashboard page renders heading with data-testid="dashboard-heading"', async ({ page }) => {
  // Log in first
  await page.goto('/login');
  await page.getByTestId('email-input').fill('mgarner22@gmail.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  const heading = page.getByTestId('dashboard-heading');
  await expect(heading).toBeVisible();
});

test('dashboard page loads without JavaScript errors after login', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/login');
  await page.getByTestId('email-input').fill('mgarner22@gmail.com');
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
  await page.getByTestId('email-input').fill('mgarner22@gmail.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  // At least one nav link should be visible (Dashboard nav item)
  const dashboardNav = page.getByTestId('nav-dashboard').first();
  await expect(dashboardNav).toBeVisible();
});
