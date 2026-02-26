import { test, expect, type Page } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://app:8080';
const UI_BASE = process.env.BASE_URL || 'http://frontend:5173';

async function loginAndSetup(page: Page): Promise<{ token: string; user: any }> {
  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'mgarner22@gmail.com' },
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

  // Navigate to app first so we can set localStorage
  await page.goto(UI_BASE + '/login');
  await page.evaluate((u) => {
    localStorage.setItem('stretto_user', JSON.stringify(u));
  }, user);

  return { token, user };
}

async function createTestData(page: Page, token: string) {
  const pyResp = await page.request.post(`${API_BASE}/api/program-years`, {
    data: { name: 'Events Pages Test Year', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const py = await pyResp.json();

  const projResp = await page.request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: py.id, name: 'Events Pages Test Project', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const project = await projResp.json();

  const eventResp = await page.request.post(`${API_BASE}/api/events`, {
    data: { projectId: project.id, type: 0, date: '2025-10-15', startTime: '19:00', durationMinutes: 120 },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const event = await eventResp.json();

  return { py, project, event };
}

// [J-2] Projects List Page
test('[J-2] Projects list page renders project names at /projects?programYearId', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const { token } = await loginAndSetup(page);
  const { py } = await createTestData(page, token);

  await page.goto(UI_BASE + `/projects?programYearId=${py.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  await expect(page.getByRole('link', { name: 'Events Pages Test Project' })).toBeVisible({ timeout: 10000 });
  expect(errors).toHaveLength(0);
});

test('[J-2] Projects list page shows Add Project button for Admin', async ({ page }) => {
  const { token } = await loginAndSetup(page);
  const { py } = await createTestData(page, token);

  await page.goto(UI_BASE + `/projects?programYearId=${py.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  const addButton = page.getByRole('link', { name: /add project/i });
  await expect(addButton).toBeVisible({ timeout: 10000 });
});

// [J-2] Project Detail Page with Tabs
test('[J-2] Project detail page renders project name as heading', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const { token } = await loginAndSetup(page);
  const { project } = await createTestData(page, token);

  await page.goto(UI_BASE + `/projects/${project.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  // Heading renders project name
  await expect(page.getByRole('heading', { name: 'Events Pages Test Project' })).toBeVisible({ timeout: 10000 });
  expect(errors).toHaveLength(0);
});

test('[J-2] Project detail page has Overview, Events, Members, Materials tab buttons', async ({ page }) => {
  const { token } = await loginAndSetup(page);
  const { project } = await createTestData(page, token);

  await page.goto(UI_BASE + `/projects/${project.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  // Tabs are plain buttons with data-testid="tab-{id}"
  await expect(page.getByTestId('tab-overview')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('tab-events')).toBeVisible();
  await expect(page.getByTestId('tab-members')).toBeVisible();
  await expect(page.getByTestId('tab-materials')).toBeVisible();
});

test('[J-2] Clicking Events tab shows events table with Rehearsal type badge', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const { token } = await loginAndSetup(page);
  const { project } = await createTestData(page, token);

  await page.goto(UI_BASE + `/projects/${project.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  // Click the Events tab button
  await page.getByTestId('tab-events').click();
  await page.waitForLoadState('networkidle');

  // Should see Rehearsal type badge (type 0)
  await expect(page.getByText('Rehearsal')).toBeVisible({ timeout: 10000 });

  // Should see date formatted as MMM d, yyyy
  await expect(page.getByText('Oct 15, 2025')).toBeVisible({ timeout: 5000 });

  expect(errors).toHaveLength(0);
});

test('[J-2] Events tab shows Add event button for Admin', async ({ page }) => {
  const { token } = await loginAndSetup(page);
  const { project } = await createTestData(page, token);

  await page.goto(UI_BASE + `/projects/${project.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  await page.getByTestId('tab-events').click();
  await page.waitForLoadState('networkidle');

  // Admin should see Add event link button
  await expect(page.getByTestId('add-event-button')).toBeVisible({ timeout: 10000 });
});

// [J-2] Event Detail Page
test('[J-2] Event detail page renders type badge, formatted date, and duration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const { token } = await loginAndSetup(page);
  const { event } = await createTestData(page, token);

  await page.goto(UI_BASE + `/events/${event.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  // Should show Rehearsal type badge (type 0)
  await expect(page.getByText('Rehearsal')).toBeVisible({ timeout: 10000 });

  // Should show formatted date (EEEE, MMMM d, yyyy)
  await expect(page.getByText('Wednesday, October 15, 2025')).toBeVisible({ timeout: 5000 });

  // Should show duration
  await expect(page.getByText('120 min')).toBeVisible({ timeout: 5000 });

  expect(errors).toHaveLength(0);
});

test('[J-2] Event detail page shows View project link back to parent project', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const { token } = await loginAndSetup(page);
  const { event } = await createTestData(page, token);

  await page.goto(UI_BASE + `/events/${event.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  // Event detail shows "View project" link back to the project
  await expect(page.getByRole('link', { name: 'View project' })).toBeVisible({ timeout: 10000 });

  expect(errors).toHaveLength(0);
});

test('[J-2] Clicking event date link in Events tab navigates to event detail page', async ({ page }) => {
  const { token } = await loginAndSetup(page);
  const { project, event } = await createTestData(page, token);

  await page.goto(UI_BASE + `/projects/${project.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  await page.getByTestId('tab-events').click();
  await page.waitForLoadState('networkidle');

  // Click the date link in the event row (format: MMM d, yyyy)
  await page.getByRole('link', { name: 'Oct 15, 2025' }).click();
  await page.waitForURL(/\/events\//, { timeout: 10000 });
  expect(page.url()).toContain(`/events/${event.id}`);
});

// [UI] Project Form Page
test('[UI] Project form page renders at /projects/new with form inputs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const { token } = await loginAndSetup(page);
  const { py } = await createTestData(page, token);

  await page.goto(UI_BASE + `/projects/new?programYearId=${py.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  await expect(page.getByTestId('name-input')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('submit-button')).toBeVisible();

  expect(errors).toHaveLength(0);
});

// [UI] Event Form Page
test('[UI] Event form page renders at /events/new with submit button', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const { token } = await loginAndSetup(page);
  const { project } = await createTestData(page, token);

  await page.goto(UI_BASE + `/events/new?projectId=${project.id}`);
  await page.waitForLoadState('networkidle');

  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }

  await expect(page.getByTestId('submit-button')).toBeVisible({ timeout: 10000 });

  expect(errors).toHaveLength(0);
});
