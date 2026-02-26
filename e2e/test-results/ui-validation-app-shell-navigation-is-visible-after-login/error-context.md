# Test info

- Name: app shell navigation is visible after login
- Location: /app/e2e/ui-validation.spec.ts:72:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByTestId('nav-dashboard').first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByTestId('nav-dashboard').first()

    at /app/e2e/ui-validation.spec.ts:80:30
```

# Page snapshot

```yaml
- complementary:
  - text: My Choir
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
    - link "Program Years":
      - /url: /program-years
    - link "Projects":
      - /url: /projects
    - link "Utilization Grid":
      - /url: /utilization
    - link "Members":
      - /url: /members
    - link "Auditions":
      - /url: /auditions
    - link "Venues":
      - /url: /venues
    - link "Notifications":
      - /url: /notifications
  - paragraph: Admin User
  - paragraph: Admin
- main:
  - heading "Dashboard" [level=1]
  - paragraph: Welcome to Stretto.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | // Milestone 03b — Authentication / App Shell
   4 |
   5 | test('login page loads without JavaScript errors', async ({ page }) => {
   6 |   const errors: string[] = [];
   7 |   page.on('pageerror', (err) => errors.push(err.message));
   8 |   await page.goto('/login');
   9 |   expect(errors).toHaveLength(0);
  10 | });
  11 |
  12 | test('login page renders email input with data-testid="email-input"', async ({ page }) => {
  13 |   await page.goto('/login');
  14 |   const emailInput = page.getByTestId('email-input');
  15 |   await expect(emailInput).toBeVisible();
  16 | });
  17 |
  18 | test('login page renders submit button with data-testid="login-button"', async ({ page }) => {
  19 |   await page.goto('/login');
  20 |   const loginButton = page.getByTestId('login-button');
  21 |   await expect(loginButton).toBeVisible();
  22 | });
  23 |
  24 | test('root "/" redirects to "/login"', async ({ page }) => {
  25 |   await page.goto('/');
  26 |   await expect(page).toHaveURL(/\/login/);
  27 | });
  28 |
  29 | test('navigating to /dashboard without login redirects to /login', async ({ page }) => {
  30 |   await page.goto('/dashboard');
  31 |   await expect(page).toHaveURL(/\/login/);
  32 | });
  33 |
  34 | test('submitting login form with valid email redirects to /dashboard', async ({ page }) => {
  35 |   await page.goto('/login');
  36 |   await page.getByTestId('email-input').fill('admin@example.com');
  37 |   await page.getByTestId('login-button').click();
  38 |   await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  39 | });
  40 |
  41 | test('dashboard page renders heading with data-testid="dashboard-heading"', async ({ page }) => {
  42 |   // Log in first
  43 |   await page.goto('/login');
  44 |   await page.getByTestId('email-input').fill('admin@example.com');
  45 |   await page.getByTestId('login-button').click();
  46 |   await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  47 |
  48 |   const heading = page.getByTestId('dashboard-heading');
  49 |   await expect(heading).toBeVisible();
  50 | });
  51 |
  52 | test('dashboard page loads without JavaScript errors after login', async ({ page }) => {
  53 |   const errors: string[] = [];
  54 |   page.on('pageerror', (err) => errors.push(err.message));
  55 |
  56 |   await page.goto('/login');
  57 |   await page.getByTestId('email-input').fill('admin@example.com');
  58 |   await page.getByTestId('login-button').click();
  59 |   await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  60 |
  61 |   expect(errors).toHaveLength(0);
  62 | });
  63 |
  64 | test('invalid email shows validation error on login form', async ({ page }) => {
  65 |   await page.goto('/login');
  66 |   await page.getByTestId('email-input').fill('not-an-email');
  67 |   await page.getByTestId('login-button').click();
  68 |   // Should still be on login page (not redirected)
  69 |   await expect(page).toHaveURL(/\/login/);
  70 | });
  71 |
  72 | test('app shell navigation is visible after login', async ({ page }) => {
  73 |   await page.goto('/login');
  74 |   await page.getByTestId('email-input').fill('admin@example.com');
  75 |   await page.getByTestId('login-button').click();
  76 |   await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  77 |
  78 |   // At least one nav link should be visible (Dashboard nav item)
  79 |   const dashboardNav = page.getByTestId('nav-dashboard').first();
> 80 |   await expect(dashboardNav).toBeVisible();
     |                              ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  81 | });
  82 |
```