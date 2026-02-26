# Test info

- Name: /program-years renders element with data-testid="program-years-heading"
- Location: /app/e2e/program-years-validation.spec.ts:21:5

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: getByTestId('program-years-heading')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for getByTestId('program-years-heading')

    at /app/e2e/program-years-validation.spec.ts:25:25
```

# Page snapshot

```yaml
- heading "Sign in to Stretto" [level=1]
- text: Email
- textbox "Email"
- button "Sign in"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | // Milestone 04b — Program Years Admin Pages
   4 |
   5 | async function login(page: import('@playwright/test').Page) {
   6 |   await page.goto('/login');
   7 |   await page.getByTestId('email-input').fill('admin@example.com');
   8 |   await page.getByTestId('login-button').click();
   9 |   await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  10 | }
  11 |
  12 | test('/program-years page loads without JavaScript errors', async ({ page }) => {
  13 |   const errors: string[] = [];
  14 |   page.on('pageerror', (err) => errors.push(err.message));
  15 |   await login(page);
  16 |   await page.goto('/program-years');
  17 |   await page.waitForLoadState('networkidle');
  18 |   expect(errors).toHaveLength(0);
  19 | });
  20 |
  21 | test('/program-years renders element with data-testid="program-years-heading"', async ({ page }) => {
  22 |   await login(page);
  23 |   await page.goto('/program-years');
  24 |   const heading = page.getByTestId('program-years-heading');
> 25 |   await expect(heading).toBeVisible({ timeout: 10000 });
     |                         ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
  26 | });
  27 |
  28 | test('/program-years/new renders input with data-testid="name-input"', async ({ page }) => {
  29 |   await login(page);
  30 |   await page.goto('/program-years/new');
  31 |   const nameInput = page.getByTestId('name-input');
  32 |   await expect(nameInput).toBeVisible({ timeout: 10000 });
  33 | });
  34 |
  35 | test('/program-years/new renders button with data-testid="submit-button"', async ({ page }) => {
  36 |   await login(page);
  37 |   await page.goto('/program-years/new');
  38 |   const submitButton = page.getByTestId('submit-button');
  39 |   await expect(submitButton).toBeVisible({ timeout: 10000 });
  40 | });
  41 |
  42 | test('/program-years/new page loads without JavaScript errors', async ({ page }) => {
  43 |   const errors: string[] = [];
  44 |   page.on('pageerror', (err) => errors.push(err.message));
  45 |   await login(page);
  46 |   await page.goto('/program-years/new');
  47 |   await page.waitForLoadState('networkidle');
  48 |   expect(errors).toHaveLength(0);
  49 | });
  50 |
  51 | test('/program-years is protected — unauthenticated redirects to /login', async ({ page }) => {
  52 |   await page.goto('/program-years');
  53 |   await expect(page).toHaveURL(/\/login/);
  54 | });
  55 |
  56 | test('/program-years/new is protected — unauthenticated redirects to /login', async ({ page }) => {
  57 |   await page.goto('/program-years/new');
  58 |   await expect(page).toHaveURL(/\/login/);
  59 | });
  60 |
  61 | test('/program-years/new has start-date and end-date inputs', async ({ page }) => {
  62 |   await login(page);
  63 |   await page.goto('/program-years/new');
  64 |   await expect(page.getByTestId('start-date-input')).toBeVisible({ timeout: 10000 });
  65 |   await expect(page.getByTestId('end-date-input')).toBeVisible({ timeout: 10000 });
  66 | });
  67 |
  68 | test('clicking "New Program Year" link on /program-years navigates to /program-years/new', async ({ page }) => {
  69 |   await login(page);
  70 |   await page.goto('/program-years');
  71 |   await page.waitForLoadState('networkidle');
  72 |   const addLink = page.getByTestId('add-program-year-button');
  73 |   await expect(addLink).toBeVisible({ timeout: 10000 });
  74 |   await addLink.click();
  75 |   await expect(page).toHaveURL(/\/program-years\/new/);
  76 | });
  77 |
```