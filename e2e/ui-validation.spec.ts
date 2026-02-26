import { test, expect } from '@playwright/test';

test('homepage loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  expect(errors).toHaveLength(0);
});

test('homepage renders Stretto heading', async ({ page }) => {
  await page.goto('/');
  const heading = page.getByRole('heading', { name: 'Stretto' });
  await expect(heading).toBeVisible();
});

test('root route "/" renders without 404', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).not.toBe(404);
});

test('page has correct title or body content', async ({ page }) => {
  await page.goto('/');
  const body = await page.textContent('body');
  expect(body).toContain('Stretto');
});
