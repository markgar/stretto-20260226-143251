import { test, expect } from '@playwright/test';

// Milestone 04b — Program Years Admin Pages

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('admin@example.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test('/program-years page loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await login(page);
  await page.goto('/program-years');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});

test('/program-years renders element with data-testid="program-years-heading"', async ({ page }) => {
  await login(page);
  await page.goto('/program-years');
  const heading = page.getByTestId('program-years-heading');
  await expect(heading).toBeVisible({ timeout: 10000 });
});

test('/program-years/new renders input with data-testid="name-input"', async ({ page }) => {
  await login(page);
  await page.goto('/program-years/new');
  const nameInput = page.getByTestId('name-input');
  await expect(nameInput).toBeVisible({ timeout: 10000 });
});

test('/program-years/new renders button with data-testid="submit-button"', async ({ page }) => {
  await login(page);
  await page.goto('/program-years/new');
  const submitButton = page.getByTestId('submit-button');
  await expect(submitButton).toBeVisible({ timeout: 10000 });
});

test('/program-years/new page loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await login(page);
  await page.goto('/program-years/new');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});

test('/program-years is protected — unauthenticated redirects to /login', async ({ page }) => {
  await page.goto('/program-years');
  await expect(page).toHaveURL(/\/login/);
});

test('/program-years/new is protected — unauthenticated redirects to /login', async ({ page }) => {
  await page.goto('/program-years/new');
  await expect(page).toHaveURL(/\/login/);
});

test('/program-years/new has start-date and end-date inputs', async ({ page }) => {
  await login(page);
  await page.goto('/program-years/new');
  await expect(page.getByTestId('start-date-input')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('end-date-input')).toBeVisible({ timeout: 10000 });
});

test('clicking "New Program Year" link on /program-years navigates to /program-years/new', async ({ page }) => {
  await login(page);
  await page.goto('/program-years');
  await page.waitForLoadState('networkidle');
  const addLink = page.getByTestId('add-program-year-button');
  await expect(addLink).toBeVisible({ timeout: 10000 });
  await addLink.click();
  await expect(page).toHaveURL(/\/program-years\/new/);
});
