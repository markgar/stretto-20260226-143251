# Test info

- Name: J-1: Smoke — Login and Navigate the App Shell >> all admin nav links are visible in sidebar
- Location: /app/e2e/milestone-04a-validation.spec.ts:38:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByTestId('nav-dashboard').first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByTestId('nav-dashboard').first()

    at /app/e2e/milestone-04a-validation.spec.ts:47:26
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
   3 | // Milestone 04a — Program Years API
   4 | // J-1: Smoke — Login and Navigate the App Shell
   5 |
   6 | const ADMIN_EMAIL = 'admin@example.com';
   7 |
   8 | test.describe('J-1: Smoke — Login and Navigate the App Shell', () => {
   9 |   test('unauthenticated root redirects to /login', async ({ page }) => {
  10 |     await page.goto('/');
  11 |     await expect(page).toHaveURL(/\/login/);
  12 |   });
  13 |
  14 |   test('login with admin email redirects to /dashboard', async ({ page }) => {
  15 |     await page.goto('/login');
  16 |     await page.getByTestId('email-input').fill(ADMIN_EMAIL);
  17 |     await page.getByTestId('login-button').click();
  18 |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  19 |   });
  20 |
  21 |   test('sidebar shows organization name "My Choir" after login', async ({ page }) => {
  22 |     await page.goto('/login');
  23 |     await page.getByTestId('email-input').fill(ADMIN_EMAIL);
  24 |     await page.getByTestId('login-button').click();
  25 |     await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  26 |     await expect(page.getByText('My Choir').first()).toBeVisible();
  27 |   });
  28 |
  29 |   test('sidebar shows Program Years nav link', async ({ page }) => {
  30 |     await page.goto('/login');
  31 |     await page.getByTestId('email-input').fill(ADMIN_EMAIL);
  32 |     await page.getByTestId('login-button').click();
  33 |     await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  34 |     const navLink = page.getByTestId('nav-program-years').first();
  35 |     await expect(navLink).toBeVisible();
  36 |   });
  37 |
  38 |   test('all admin nav links are visible in sidebar', async ({ page }) => {
  39 |     await page.goto('/login');
  40 |     await page.getByTestId('email-input').fill(ADMIN_EMAIL);
  41 |     await page.getByTestId('login-button').click();
  42 |     await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  43 |
  44 |     const navItems = ['dashboard', 'program-years', 'members', 'venues'];
  45 |     for (const item of navItems) {
  46 |       const link = page.getByTestId(`nav-${item}`).first();
> 47 |       await expect(link).toBeVisible();
     |                          ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  48 |     }
  49 |   });
  50 |
  51 |   test('clicking Program Years nav link loads without JS error', async ({ page }) => {
  52 |     const errors: string[] = [];
  53 |     page.on('pageerror', (err) => errors.push(err.message));
  54 |
  55 |     await page.goto('/login');
  56 |     await page.getByTestId('email-input').fill(ADMIN_EMAIL);
  57 |     await page.getByTestId('login-button').click();
  58 |     await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  59 |
  60 |     const navLink = page.getByTestId('nav-program-years').first();
  61 |     await navLink.click();
  62 |     await page.waitForTimeout(2000);
  63 |     expect(errors).toHaveLength(0);
  64 |   });
  65 |
  66 |   test('user name and role appear at bottom of sidebar', async ({ page }) => {
  67 |     await page.goto('/login');
  68 |     await page.getByTestId('email-input').fill(ADMIN_EMAIL);
  69 |     await page.getByTestId('login-button').click();
  70 |     await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  71 |
  72 |     // User's name or "Admin" role should appear somewhere in sidebar
  73 |     const adminText = page.getByText('Admin').first();
  74 |     await expect(adminText).toBeVisible();
  75 |   });
  76 |
  77 |   test('GET /health returns 200 (via API)', async ({ request }) => {
  78 |     const response = await request.get('http://app:8080/health');
  79 |     expect(response.status()).toBe(200);
  80 |     const body = await response.json();
  81 |     expect(body.status).toBe('healthy');
  82 |   });
  83 | });
  84 |
```