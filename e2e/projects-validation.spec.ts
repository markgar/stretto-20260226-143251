import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://app:8080';
const PY_ID = '22222222-2222-2222-2222-222222222222';

async function loginAsAdmin(request: any) {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'mgarner22@gmail.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = resp.headers()['set-cookie'];
  const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  return token;
}

async function loginAsMember(request: any) {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'mgarner@outlook.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = resp.headers()['set-cookie'];
  const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  return token;
}

// [J-1] Smoke: Login and Navigate the App Shell
test('[J-1] J-1: GET /health returns 200', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/health`);
  expect(resp.status()).toBe(200);
});

test('[J-1] J-1: Login returns 200 with user fields', async ({ request }) => {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'mgarner22@gmail.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.email).toBe('mgarner22@gmail.com');
  expect(body.role).toBe('Admin');
  expect(body.orgName).toBe('My Choir');
});

// Projects API Tests
test('GET /api/projects without auth returns 401', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/api/projects?programYearId=${PY_ID}`);
  expect(resp.status()).toBe(401);
});

test('POST /api/projects as admin returns 201 with project fields', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const resp = await request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: PY_ID, name: 'Spring Concert', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(201);
  const body = await resp.json();
  expect(body.id).toBeTruthy();
  expect(body.name).toBe('Spring Concert');
  expect(body.programYearId).toBe(PY_ID);
  expect(body.startDate).toBe('2025-09-01');
  expect(body.endDate).toBe('2026-06-30');
});

test('GET /api/projects?programYearId=... returns 200 with array containing created project', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const createResp = await request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: PY_ID, name: 'Test Project List', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const created = await createResp.json();

  const listResp = await request.get(`${API_BASE}/api/projects?programYearId=${PY_ID}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(listResp.status()).toBe(200);
  const body = await listResp.json();
  expect(Array.isArray(body)).toBe(true);
  const found = body.find((p: any) => p.id === created.id);
  expect(found).toBeTruthy();
});

test('GET /api/projects/{id} returns 200 with matching name', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const createResp = await request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: PY_ID, name: 'Get By ID Project', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const created = await createResp.json();

  const getResp = await request.get(`${API_BASE}/api/projects/${created.id}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(getResp.status()).toBe(200);
  const body = await getResp.json();
  expect(body.name).toBe('Get By ID Project');
});

test('PUT /api/projects/{id} returns 200 with updated name', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const createResp = await request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: PY_ID, name: 'Spring Concert', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const created = await createResp.json();

  const putResp = await request.put(`${API_BASE}/api/projects/${created.id}`, {
    data: { name: 'Spring Gala', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  expect(putResp.status()).toBe(200);
  const body = await putResp.json();
  expect(body.name).toBe('Spring Gala');
});

test('POST /api/projects with startDate >= endDate returns 422', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const resp = await request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: PY_ID, name: 'Bad Dates', startDate: '2026-06-30', endDate: '2025-09-01' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(422);
});

test('DELETE /api/projects/{id} returns 204 and subsequent GET returns 404', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const createResp = await request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: PY_ID, name: 'To Delete', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const created = await createResp.json();

  const delResp = await request.delete(`${API_BASE}/api/projects/${created.id}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(delResp.status()).toBe(204);

  const getResp = await request.get(`${API_BASE}/api/projects/${created.id}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(getResp.status()).toBe(404);
});

test('POST /api/projects as Member returns 403', async ({ request }) => {
  const token = await loginAsMember(request);
  const resp = await request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: PY_ID, name: 'Member Project', startDate: '2025-09-01', endDate: '2026-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(403);
});

// UI Smoke: J-1 App Shell Navigation
test('[J-1] Login page renders and redirects to dashboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/login');
  const emailInput = page.getByTestId('email-input');
  await expect(emailInput).toBeVisible();
  await emailInput.fill('mgarner22@gmail.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  expect(errors).toHaveLength(0);
});

test('[J-1] Sidebar shows organization name My Choir after login', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('mgarner22@gmail.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByText('My Choir')).toBeVisible();
});

test('[J-1] Sidebar shows Projects nav link after login', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('mgarner22@gmail.com');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  // Nav uses nav-desktop-{label} pattern (see AppShell.tsx)
  const projectsNav = page.getByTestId('nav-desktop-projects');
  await expect(projectsNav).toBeVisible();
});

test('[J-1] Unauthenticated access to dashboard redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL(/\/login/, { timeout: 10000 });
  const url = page.url();
  expect(url).toContain('/login');
});
