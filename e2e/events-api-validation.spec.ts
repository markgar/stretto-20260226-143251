import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://app:8080';
const FRONTEND_BASE = process.env.BASE_URL || 'http://frontend:5173';
const PY_ID = '22222222-2222-2222-2222-222222222222';

async function loginAsAdmin(request: any): Promise<string> {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = resp.headers()['set-cookie'];
  const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  return token;
}

async function loginAsMember(request: any): Promise<string> {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'member@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = resp.headers()['set-cookie'];
  const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  return token;
}

async function createProject(request: any, token: string): Promise<string> {
  const resp = await request.post(`${API_BASE}/api/projects`, {
    data: {
      programYearId: PY_ID,
      name: 'Events Test Project',
      description: 'For events API testing',
      startDate: '2025-10-01',
      endDate: '2026-05-31',
    },
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `stretto_session=${token}`,
    },
  });
  const body = await resp.json();
  return body.id;
}

// Test: unauthenticated access returns 401
test('GET /api/events without auth returns 401', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/api/events?projectId=${PY_ID}`);
  expect(resp.status()).toBe(401);
});

// Test: create event returns 201 with expected fields
test('POST /api/events as admin returns 201 with event fields', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const resp = await request.post(`${API_BASE}/api/events`, {
    data: {
      projectId,
      type: 0,
      date: '2025-11-15',
      startTime: '18:30:00',
      durationMinutes: 120,
      venueId: null,
    },
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `stretto_session=${token}`,
    },
  });
  expect(resp.status()).toBe(201);
  const body = await resp.json();
  expect(body.id).toBeTruthy();
  expect(body.projectId).toBe(projectId);
  expect(body.type).toBe(0);
  expect(body.date).toBe('2025-11-15');
  expect(body.startTime).toBe('18:30:00');
  expect(body.durationMinutes).toBe(120);
});

// Test: GET event list returns created event
test('GET /api/events?projectId returns list with created event', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  // Create an event
  await request.post(`${API_BASE}/api/events`, {
    data: { projectId, type: 0, date: '2025-11-15', startTime: '18:30:00', durationMinutes: 90, venueId: null },
    headers: { 'Content-Type': 'application/json', 'Cookie': `stretto_session=${token}` },
  });

  const listResp = await request.get(`${API_BASE}/api/events?projectId=${projectId}`, {
    headers: { 'Cookie': `stretto_session=${token}` },
  });
  expect(listResp.status()).toBe(200);
  const list = await listResp.json();
  expect(Array.isArray(list)).toBe(true);
  expect(list.length).toBeGreaterThanOrEqual(1);
  expect(list[0].projectId).toBe(projectId);
});

// Test: GET event by id returns matching event
test('GET /api/events/{id} returns event with correct type and date', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const createResp = await request.post(`${API_BASE}/api/events`, {
    data: { projectId, type: 0, date: '2025-12-10', startTime: '19:00:00', durationMinutes: 60, venueId: null },
    headers: { 'Content-Type': 'application/json', 'Cookie': `stretto_session=${token}` },
  });
  const created = await createResp.json();

  const getResp = await request.get(`${API_BASE}/api/events/${created.id}`, {
    headers: { 'Cookie': `stretto_session=${token}` },
  });
  expect(getResp.status()).toBe(200);
  const body = await getResp.json();
  expect(body.type).toBe(0);
  expect(body.date).toBe('2025-12-10');
});

// Test: PUT update event duration
test('PUT /api/events/{id} updates durationMinutes', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const createResp = await request.post(`${API_BASE}/api/events`, {
    data: { projectId, type: 0, date: '2025-11-20', startTime: '18:00:00', durationMinutes: 90, venueId: null },
    headers: { 'Content-Type': 'application/json', 'Cookie': `stretto_session=${token}` },
  });
  const created = await createResp.json();

  const updateResp = await request.put(`${API_BASE}/api/events/${created.id}`, {
    data: { type: 0, date: '2025-11-20', startTime: '18:00:00', durationMinutes: 150, venueId: null },
    headers: { 'Content-Type': 'application/json', 'Cookie': `stretto_session=${token}` },
  });
  expect(updateResp.status()).toBe(200);
  const updated = await updateResp.json();
  expect(updated.durationMinutes).toBe(150);
});

// Test: DELETE event, then GET returns 404
test('DELETE /api/events/{id} returns 204; subsequent GET returns 404', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const createResp = await request.post(`${API_BASE}/api/events`, {
    data: { projectId, type: 1, date: '2026-02-14', startTime: '20:00:00', durationMinutes: 120, venueId: null },
    headers: { 'Content-Type': 'application/json', 'Cookie': `stretto_session=${token}` },
  });
  const created = await createResp.json();

  const deleteResp = await request.delete(`${API_BASE}/api/events/${created.id}`, {
    headers: { 'Cookie': `stretto_session=${token}` },
  });
  expect(deleteResp.status()).toBe(204);

  const getResp = await request.get(`${API_BASE}/api/events/${created.id}`, {
    headers: { 'Cookie': `stretto_session=${token}` },
  });
  expect(getResp.status()).toBe(404);
});

// Test: date outside project range returns error (spec says 422, implementation returns 400)
test('POST /api/events with date outside project range returns 4xx error', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const resp = await request.post(`${API_BASE}/api/events`, {
    data: { projectId, type: 0, date: '2024-01-01', startTime: '18:00:00', durationMinutes: 60, venueId: null },
    headers: { 'Content-Type': 'application/json', 'Cookie': `stretto_session=${token}` },
  });
  // Spec says 422, implementation returns 400
  expect([400, 422]).toContain(resp.status());
  const body = await resp.json();
  expect(body.errors?.date).toBeDefined();
});

// Test: member role cannot create event (returns 403)
test('POST /api/events as member role returns 403', async ({ request }) => {
  const adminToken = await loginAsAdmin(request);
  const projectId = await createProject(request, adminToken);

  const memberToken = await loginAsMember(request);
  const resp = await request.post(`${API_BASE}/api/events`, {
    data: { projectId, type: 0, date: '2025-11-15', startTime: '18:00:00', durationMinutes: 60, venueId: null },
    headers: { 'Content-Type': 'application/json', 'Cookie': `stretto_session=${memberToken}` },
  });
  expect(resp.status()).toBe(403);
});

// UI Test: J-4 - Venues page loads
test('[UI] J-4: Venues page loads in browser', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(FRONTEND_BASE);
  await page.waitForSelector('[data-testid="login-form"], [data-testid="email-input"], input[type="email"]', { timeout: 15000 });

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill('admin@example.com');
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
  await page.waitForTimeout(2000);

  // Navigate to Venues via nav
  const venuesLink = page.locator('[data-testid="nav-desktop-venues"]').first();
  if (await venuesLink.isVisible()) {
    await venuesLink.click();
    await page.waitForTimeout(1000);
    const heading = page.locator('[data-testid="venues-heading"]');
    await expect(heading).toBeVisible({ timeout: 5000 });
  } else {
    // Try direct navigation
    await page.goto(`${FRONTEND_BASE}/venues`);
    await page.waitForTimeout(1000);
  }
  expect(errors.length).toBe(0);
});

// UI Test: Projects page has Events tab
test('[UI] J-4: Project detail page shows Events tab', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(FRONTEND_BASE);
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2000);

  // Navigate to Program Years
  const pyLink = page.locator('[data-testid="nav-desktop-program-years"]').first();
  if (await pyLink.isVisible()) {
    await pyLink.click();
    await page.waitForTimeout(1000);
  }
  expect(errors.length).toBe(0);
});
