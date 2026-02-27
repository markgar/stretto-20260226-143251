import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://app:8080';

async function loginAsAdmin(request: any) {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com', password: 'password' },
  });
  expect(resp.ok()).toBeTruthy();
  const cookies = resp.headers()['set-cookie'] || '';
  const match = cookies.match(/stretto_session=([^;]+)/);
  return match ? match[1] : '';
}

async function loginAsMember(request: any) {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'member@example.com', password: 'password' },
  });
  expect(resp.ok()).toBeTruthy();
  const cookies = resp.headers()['set-cookie'] || '';
  const match = cookies.match(/stretto_session=([^;]+)/);
  return match ? match[1] : '';
}

test('GET /api/dashboard/summary without auth returns 401', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/api/dashboard/summary`);
  expect(resp.status()).toBe(401);
});

test('GET /api/dashboard/summary with admin auth returns 200 with correct fields', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const resp = await request.get(`${API_BASE}/api/dashboard/summary`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body).toHaveProperty('programYearId');
  expect(body).toHaveProperty('programYearName');
  expect(body).toHaveProperty('upcomingEvents');
  expect(body).toHaveProperty('recentActivity');
  expect(Array.isArray(body.upcomingEvents)).toBe(true);
  expect(Array.isArray(body.recentActivity)).toBe(true);
});

test('GET /api/dashboard/summary?programYearId=valid returns 200 with matching programYearId', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const validId = '22222222-2222-2222-2222-222222222222';
  const resp = await request.get(`${API_BASE}/api/dashboard/summary?programYearId=${validId}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.programYearId).toBe(validId);
});

test('GET /api/dashboard/summary?programYearId=unknown returns 404', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const resp = await request.get(
    `${API_BASE}/api/dashboard/summary?programYearId=99999999-9999-9999-9999-999999999999`,
    { headers: { Cookie: `stretto_session=${token}` } }
  );
  expect(resp.status()).toBe(404);
});

test('GET /api/dashboard/summary with member role returns 403', async ({ request }) => {
  const token = await loginAsMember(request);
  const resp = await request.get(`${API_BASE}/api/dashboard/summary`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(403);
});
