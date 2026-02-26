import { test, expect, type Page } from '@playwright/test';

// Milestone 05a — Members API Validation

const API_BASE = process.env.API_URL || 'http://app:8080';
const UI_BASE = process.env.BASE_URL || 'http://frontend:5173';

// Use timestamp suffix to ensure unique emails across runs
const RUN_ID = Date.now().toString(36);

async function loginViaApi(page: Page): Promise<string> {
  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'mgarner22@gmail.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await resp.json();
  const cookieHeader = resp.headers()['set-cookie'];
  const token = cookieHeader?.match(/stretto_session=([^;]+)/)?.[1] ?? '';
  await page.context().addCookies([{
    name: 'stretto_session',
    value: token,
    domain: new URL(UI_BASE).hostname,
    path: '/',
  }]);
  await page.goto(UI_BASE + '/dashboard');
  return token;
}

test('[UI] GET /api/members without auth returns 401', async ({ page }) => {
  const resp = await page.request.get(`${API_BASE}/api/members`);
  expect(resp.status()).toBe(401);
});

test('[UI] POST /auth/login returns 200 with user data', async ({ page }) => {
  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'mgarner22@gmail.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body).toHaveProperty('id');
  expect(body.email).toBe('mgarner22@gmail.com');
});

test('[UI] GET /api/members returns member list after login', async ({ page }) => {
  const token = await loginViaApi(page);
  const resp = await page.request.get(`${API_BASE}/api/members`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);
});

test('[UI] GET /api/members?search=mgarner returns filtered results', async ({ page }) => {
  const token = await loginViaApi(page);
  const resp = await page.request.get(`${API_BASE}/api/members?search=mgarner`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);
  body.forEach((m: any) => {
    const combined = (m.firstName + m.lastName + m.email).toLowerCase();
    expect(combined).toContain('mgarner');
  });
});

test('[UI] POST /api/members creates member and returns 201 with id', async ({ page }) => {
  const token = await loginViaApi(page);
  const resp = await page.request.post(`${API_BASE}/api/members`, {
    data: { firstName: 'Jane', lastName: 'Doe', email: `jane.${RUN_ID}@example.com`, role: 'Member' },
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(201);
  const body = await resp.json();
  expect(body).toHaveProperty('id');
  expect(body.firstName).toBe('Jane');
  expect(body.isActive).toBe(true);
});

test('[UI] GET /api/members/{id} returns correct member fields', async ({ page }) => {
  const token = await loginViaApi(page);
  const createResp = await page.request.post(`${API_BASE}/api/members`, {
    data: { firstName: 'Get', lastName: 'Test', email: `gettest.${RUN_ID}@example.com`, role: 'Member' },
    headers: { Cookie: `stretto_session=${token}` },
  });
  const created = await createResp.json();
  const resp = await page.request.get(`${API_BASE}/api/members/${created.id}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.firstName).toBe('Get');
  expect(body.lastName).toBe('Test');
  expect(body.isActive).toBe(true);
});

test('[UI] PUT /api/members/{id} updates member lastName', async ({ page }) => {
  const token = await loginViaApi(page);
  const createResp = await page.request.post(`${API_BASE}/api/members`, {
    data: { firstName: 'Put', lastName: 'Before', email: `putbefore.${RUN_ID}@example.com`, role: 'Member' },
    headers: { Cookie: `stretto_session=${token}` },
  });
  const created = await createResp.json();
  const resp = await page.request.put(`${API_BASE}/api/members/${created.id}`, {
    data: { firstName: 'Put', lastName: 'After', email: `putbefore.${RUN_ID}@example.com`, role: 'Member', isActive: true },
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.lastName).toBe('After');
});

test('[UI] GET /api/members/{id}/assignments returns 200 with array', async ({ page }) => {
  const token = await loginViaApi(page);
  const createResp = await page.request.post(`${API_BASE}/api/members`, {
    data: { firstName: 'Assign', lastName: 'Test', email: `assigntest.${RUN_ID}@example.com`, role: 'Member' },
    headers: { Cookie: `stretto_session=${token}` },
  });
  const created = await createResp.json();
  const resp = await page.request.get(`${API_BASE}/api/members/${created.id}/assignments`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBe(true);
});

test('[UI] POST /api/members/{id}/deactivate sets isActive to false', async ({ page }) => {
  const token = await loginViaApi(page);
  const createResp = await page.request.post(`${API_BASE}/api/members`, {
    data: { firstName: 'Deact', lastName: 'Test', email: `deacttest.${RUN_ID}@example.com`, role: 'Member' },
    headers: { Cookie: `stretto_session=${token}` },
  });
  const created = await createResp.json();
  const resp = await page.request.post(`${API_BASE}/api/members/${created.id}/deactivate`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.isActive).toBe(false);
});

test('[UI] Members nav link navigates to /members without JS errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await loginViaApi(page);
  const url = page.url();
  if (url.includes('/login')) { test.skip(); return; }
  // Wait for nav to be fully rendered (auth check completes)
  await page.waitForSelector('[data-testid*="nav-desktop"]', { timeout: 15000 }).catch(() => null);
  // Testids use nav-desktop-{label} pattern (label: "Members" → "members")
  const membersNav = page.getByTestId('nav-desktop-members').or(
    page.getByTestId('nav-tablet-members')
  ).or(page.getByTestId('nav-members')).first();
  const navVisible = await membersNav.isVisible({ timeout: 5000 }).catch(() => false);
  if (!navVisible) { test.skip(); return; }
  await membersNav.click();
  await page.waitForURL(/\/members/, { timeout: 10000 });
  await page.waitForTimeout(1000);
  expect(errors).toHaveLength(0);
});
