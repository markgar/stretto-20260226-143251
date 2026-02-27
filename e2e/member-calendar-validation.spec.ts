import { test, expect } from '@playwright/test';

const API_BASE = 'http://app:8080';
const ADMIN_EMAIL = 'admin@example.com';
const MEMBER_EMAIL = 'member@example.com';
const PASSWORD = 'password';

async function loginViaApi(email: string): Promise<{ session: string; user: Record<string, unknown> }> {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
    redirect: 'manual',
  });
  const user = await resp.json();
  const setCookie = resp.headers.get('set-cookie') || '';
  const match = setCookie.match(/stretto_session=([^;]+)/);
  const session = match ? match[1] : '';
  return { session, user };
}

async function setupAuthContext(page: any, email: string) {
  const { session, user } = await loginViaApi(email);
  await page.context().addCookies([{
    name: 'stretto_session',
    value: session,
    domain: 'frontend',
    path: '/',
    secure: false,
  }]);
  await page.evaluate((u: unknown) => {
    localStorage.setItem('stretto_user', JSON.stringify(u));
  }, user);
  return { session, user };
}

// API-level tests
test('GET /health returns 200 with healthy status', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/health`);
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.status).toBe('healthy');
});

test('GET /api/members/me/projects returns 401 without auth', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/api/members/me/projects`);
  expect(resp.status()).toBe(401);
});

test('GET /api/members/me/calendar returns 401 without auth', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/api/members/me/calendar`);
  expect(resp.status()).toBe(401);
});

test('GET /api/members/me/calendar.ics returns 401 without auth', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/api/members/me/calendar.ics`);
  expect(resp.status()).toBe(401);
});

test('GET /api/members/me/projects with member session returns 200 with array', async ({ request }) => {
  const { session } = await loginViaApi(MEMBER_EMAIL);
  const resp = await request.get(`${API_BASE}/api/members/me/projects`, {
    headers: { Cookie: `stretto_session=${session}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBeTruthy();
});

test('GET /api/members/me/calendar with member session returns 200 with array', async ({ request }) => {
  const { session } = await loginViaApi(MEMBER_EMAIL);
  const resp = await request.get(`${API_BASE}/api/members/me/calendar`, {
    headers: { Cookie: `stretto_session=${session}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBeTruthy();
});

test('GET /api/members/me/calendar.ics with member session returns iCal feed', async ({ request }) => {
  const { session } = await loginViaApi(MEMBER_EMAIL);
  const resp = await request.get(`${API_BASE}/api/members/me/calendar.ics`, {
    headers: { Cookie: `stretto_session=${session}` },
  });
  expect(resp.status()).toBe(200);
  const ct = resp.headers()['content-type'] || '';
  expect(ct).toContain('text/calendar');
  const body = await resp.text();
  expect(body).toContain('BEGIN:VCALENDAR');
});

test('GET /api/members/me/projects with admin session returns 200 with array', async ({ request }) => {
  const { session } = await loginViaApi(ADMIN_EMAIL);
  const resp = await request.get(`${API_BASE}/api/members/me/projects`, {
    headers: { Cookie: `stretto_session=${session}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBeTruthy();
});

test('GET /api/members/me/calendar with admin session returns 200 with array', async ({ request }) => {
  const { session } = await loginViaApi(ADMIN_EMAIL);
  const resp = await request.get(`${API_BASE}/api/members/me/calendar`, {
    headers: { Cookie: `stretto_session=${session}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBeTruthy();
});

test('calendar.ics response has Content-Disposition attachment header', async ({ request }) => {
  const { session } = await loginViaApi(ADMIN_EMAIL);
  const resp = await request.get(`${API_BASE}/api/members/me/calendar.ics`, {
    headers: { Cookie: `stretto_session=${session}` },
  });
  expect(resp.status()).toBe(200);
  const cd = resp.headers()['content-disposition'] || '';
  expect(cd).toContain('attachment');
  expect(cd).toContain('.ics');
});

test('iCal feed contains required VCALENDAR fields', async ({ request }) => {
  const { session } = await loginViaApi(ADMIN_EMAIL);
  const resp = await request.get(`${API_BASE}/api/members/me/calendar.ics`, {
    headers: { Cookie: `stretto_session=${session}` },
  });
  const body = await resp.text();
  expect(body).toContain('BEGIN:VCALENDAR');
  expect(body).toContain('VERSION:2.0');
  expect(body).toContain('END:VCALENDAR');
});
