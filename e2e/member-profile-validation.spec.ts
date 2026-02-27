import { test, expect, type Page } from '@playwright/test';

// Milestone 14a1 — Member Profile Backend Validation

const API_BASE = process.env.API_URL || 'http://app:8080';

async function loginViaApi(page: Page, email: string): Promise<string> {
  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookieHeader = resp.headers()['set-cookie'];
  const token = cookieHeader?.match(/stretto_session=([^;]+)/)?.[1] ?? '';
  return token;
}

test('[14a1] GET /health returns 200 with status:healthy', async ({ page }) => {
  const resp = await page.request.get(`${API_BASE}/health`);
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.status).toBe('healthy');
});

test('[14a1] GET /api/members/me without auth returns 401', async ({ page }) => {
  const resp = await page.request.get(`${API_BASE}/api/members/me`);
  expect(resp.status()).toBe(401);
});

test('[14a1] GET /api/members/me with member session returns 200 with profile fields', async ({ page }) => {
  const token = await loginViaApi(page, 'member@example.com');
  const resp = await page.request.get(`${API_BASE}/api/members/me`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('firstName');
  expect(body).toHaveProperty('lastName');
  expect(body).toHaveProperty('email');
  expect(body).toHaveProperty('notificationOptOut');
  expect(typeof body.notificationOptOut).toBe('boolean');
});

test('[14a1] GET /api/members/me with admin session returns 200', async ({ page }) => {
  const token = await loginViaApi(page, 'admin@example.com');
  const resp = await page.request.get(`${API_BASE}/api/members/me`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.email).toBe('admin@example.com');
  expect(body).toHaveProperty('notificationOptOut');
});

test('[14a1] PUT /api/members/me updates profile and returns 200', async ({ page }) => {
  const token = await loginViaApi(page, 'member@example.com');

  // First get the current member
  const getMeResp = await page.request.get(`${API_BASE}/api/members/me`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  const current = await getMeResp.json();

  // Update profile
  const resp = await page.request.put(`${API_BASE}/api/members/me`, {
    data: {
      firstName: 'Test',
      lastName: 'User',
      email: current.email,
      notificationOptOut: true,
    },
    headers: {
      Cookie: `stretto_session=${token}`,
      'Content-Type': 'application/json',
    },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.firstName).toBe('Test');
  expect(body.lastName).toBe('User');
  expect(body.notificationOptOut).toBe(true);
});

test('[14a1] PUT /api/members/me persists changes (GET reflects update)', async ({ page }) => {
  const token = await loginViaApi(page, 'member@example.com');

  // Get current state
  const getMeResp = await page.request.get(`${API_BASE}/api/members/me`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  const current = await getMeResp.json();
  const newFirstName = `Updated${Date.now().toString(36)}`;

  // Update
  await page.request.put(`${API_BASE}/api/members/me`, {
    data: {
      firstName: newFirstName,
      lastName: current.lastName,
      email: current.email,
      notificationOptOut: false,
    },
    headers: {
      Cookie: `stretto_session=${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Verify persistence
  const verifyResp = await page.request.get(`${API_BASE}/api/members/me`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  const verified = await verifyResp.json();
  expect(verified.firstName).toBe(newFirstName);
});

test('[14a1] PUT /api/members/me without auth returns 401', async ({ page }) => {
  const resp = await page.request.put(`${API_BASE}/api/members/me`, {
    data: { firstName: 'Test', lastName: 'User', email: 'test@example.com', notificationOptOut: false },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(resp.status()).toBe(401);
});
