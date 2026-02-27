import { test, expect } from '@playwright/test';

const BASE_API = 'http://app:8080';

async function loginAsAdmin(request: any) {
  const resp = await request.post(`${BASE_API}/auth/login`, {
    data: { email: 'admin@example.com', password: '' },
  });
  expect(resp.status()).toBe(200);
  const cookies = resp.headers()['set-cookie'] || '';
  const match = cookies.match(/stretto_session=([^;]+)/);
  return match ? match[1] : '';
}

test('health check returns 200', async ({ request }) => {
  const resp = await request.get(`${BASE_API}/health`);
  expect(resp.status()).toBe(200);
});

test('GET /api/notifications/assignment-recipients requires auth', async ({ request }) => {
  const resp = await request.get(`${BASE_API}/api/notifications/assignment-recipients?programYearId=22222222-2222-2222-2222-222222222222`);
  expect(resp.status()).toBe(401);
});

test('GET /api/notifications/audition-recipients requires auth', async ({ request }) => {
  const resp = await request.get(`${BASE_API}/api/notifications/audition-recipients?auditionDateId=00000000-0000-0000-0000-000000000001`);
  expect(resp.status()).toBe(401);
});

test('POST /api/notifications/assignment-announcement requires auth', async ({ request }) => {
  const resp = await request.post(`${BASE_API}/api/notifications/assignment-announcement`, {
    data: { programYearId: '22222222-2222-2222-2222-222222222222', subject: 'Test', body: 'Test' },
  });
  expect(resp.status()).toBe(401);
});

test('POST /api/notifications/audition-announcement requires auth', async ({ request }) => {
  const resp = await request.post(`${BASE_API}/api/notifications/audition-announcement`, {
    data: { auditionDateId: '00000000-0000-0000-0000-000000000001', subject: 'Test', body: 'Test' },
  });
  expect(resp.status()).toBe(401);
});

test('GET /api/notifications/assignment-recipients returns 200 with array for admin', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const resp = await request.get(
    `${BASE_API}/api/notifications/assignment-recipients?programYearId=22222222-2222-2222-2222-222222222222`,
    { headers: { Cookie: `stretto_session=${token}` } }
  );
  expect(resp.status()).toBe(200);
  const data = await resp.json();
  expect(Array.isArray(data)).toBeTruthy();
});

test('POST /api/notifications/assignment-announcement returns 204 for admin', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const resp = await request.post(`${BASE_API}/api/notifications/assignment-announcement`, {
    data: { programYearId: '22222222-2222-2222-2222-222222222222', subject: 'Hello', body: 'Test body' },
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(204);
});

test('GET /api/notifications/audition-recipients returns 404 for unknown audition date', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const resp = await request.get(
    `${BASE_API}/api/notifications/audition-recipients?auditionDateId=00000000-0000-0000-0000-000000000001`,
    { headers: { Cookie: `stretto_session=${token}` } }
  );
  expect(resp.status()).toBe(404);
});

test('Notifications page renders in frontend (coming soon)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('http://frontend:5173/');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});
