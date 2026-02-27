import { test, expect, type Page } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://app:8080';
const UI_BASE = process.env.BASE_URL || 'http://frontend:5173';

async function loginAndSetup(page: Page): Promise<{ token: string; user: any }> {
  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com', password: 'password' },
    headers: { 'Content-Type': 'application/json' },
  });
  const user = await resp.json();
  const cookieHeader = resp.headers()['set-cookie'];
  const token = cookieHeader?.match(/stretto_session=([^;]+)/)?.[1] ?? '';

  // Add cookie WITHOUT secure flag so it is sent over HTTP in Playwright
  await page.context().addCookies([{
    name: 'stretto_session',
    value: token,
    domain: new URL(UI_BASE).hostname,
    path: '/',
    secure: false,
    httpOnly: false,
  }]);

  // Set localStorage user so Zustand store restores on navigation
  await page.goto(UI_BASE + '/login');
  await page.evaluate((u) => {
    localStorage.setItem('stretto_user', JSON.stringify(u));
  }, user);

  return { token, user };
}

test('[UI] Dashboard page renders heading and program year select', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');
  await page.waitForTimeout(2000);

  await expect(page.getByTestId('dashboard-heading')).toBeVisible();
  await expect(page.getByTestId('program-year-select')).toBeVisible();
  expect(errors).toHaveLength(0);
});

test('[UI] Dashboard heading text is "Dashboard"', async ({ page }) => {
  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');
  await page.waitForTimeout(2000);

  await expect(page.getByTestId('dashboard-heading')).toHaveText('Dashboard');
});

test('[UI] Dashboard program year selector has Current Year option', async ({ page }) => {
  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');
  await page.waitForTimeout(2000);

  const select = page.getByTestId('program-year-select');
  await expect(select).toBeVisible();
  await expect(select.locator('option[value=""]')).toHaveText('Current Year');
});

test('[UI] Dashboard shows no-upcoming-events empty state when no events', async ({ page }) => {
  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');
  await page.waitForTimeout(2000);

  // Seed data has no upcoming events, so empty state should show
  await expect(page.getByTestId('no-upcoming-events')).toBeVisible();
});

test('[UI] Dashboard shows recent activity items from seed data', async ({ page }) => {
  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');
  await page.waitForTimeout(2000);

  // Seed data has 2 members, so activity items should appear
  const activityItems = page.getByTestId('activity-item');
  const count = await activityItems.count();
  expect(count).toBeGreaterThan(0);
});

test('[UI] Dashboard shows Upcoming Events and Recent Activity section headings', async ({ page }) => {
  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');
  await page.waitForTimeout(2000);

  await expect(page.getByText('Upcoming Events (Next 30 Days)')).toBeVisible();
  await expect(page.getByText('Recent Activity')).toBeVisible();
});

test('[UI] Dashboard skeleton or data shows after loading', async ({ page }) => {
  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');

  // Immediately after navigation, skeleton might be shown
  // After waiting, data sections should be visible
  await page.waitForTimeout(3000);

  const noUpcoming = page.getByTestId('no-upcoming-events');
  const skeleton = page.getByTestId('dashboard-skeleton');
  const upcomingRow = page.getByTestId('upcoming-event-row').first();

  const skeletonVisible = await skeleton.isVisible().catch(() => false);
  const noUpcomingVisible = await noUpcoming.isVisible().catch(() => false);
  const upcomingRowVisible = await upcomingRow.isVisible().catch(() => false);

  // After loading, data should be shown (skeleton gone, either empty state or rows)
  expect(!skeletonVisible && (noUpcomingVisible || upcomingRowVisible)).toBeTruthy();
});

test('[UI] Dashboard program year selector lists program years', async ({ page }) => {
  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');
  await page.waitForTimeout(2000);

  const select = page.getByTestId('program-year-select');
  const options = select.locator('option');
  const count = await options.count();
  expect(count).toBeGreaterThanOrEqual(1); // At minimum "Current Year"
});

test('[UI] Dashboard no-recent-activity or activity items visible', async ({ page }) => {
  await loginAndSetup(page);
  await page.goto(UI_BASE + '/dashboard');
  await page.waitForTimeout(2000);

  const noActivity = page.getByTestId('no-recent-activity');
  const activityItem = page.getByTestId('activity-item').first();

  const noActivityVisible = await noActivity.isVisible().catch(() => false);
  const activityVisible = await activityItem.isVisible().catch(() => false);

  expect(noActivityVisible || activityVisible).toBeTruthy();
});

// API tests (no UI navigation needed)
test('[UI] Dashboard API GET /api/dashboard/summary returns 200 for admin', async ({ page }) => {
  const { token } = await loginAndSetup(page);

  const response = await page.request.get(`${API_BASE}/api/dashboard/summary`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('upcomingEvents');
  expect(body).toHaveProperty('recentActivity');
  expect(Array.isArray(body.upcomingEvents)).toBeTruthy();
  expect(Array.isArray(body.recentActivity)).toBeTruthy();
});

test('[UI] Dashboard API returns 401 when not authenticated', async ({ page }) => {
  const response = await page.request.get(`${API_BASE}/api/dashboard/summary`);
  expect(response.status()).toBe(401);
});
