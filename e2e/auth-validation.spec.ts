import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || 'http://app:8080';

test('POST /auth/login with valid email returns 200 with user fields', async ({ request }) => {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('email');
  expect(body).toHaveProperty('firstName');
  expect(body).toHaveProperty('lastName');
  expect(body).toHaveProperty('role');
  expect(body).toHaveProperty('orgId');
  expect(body).toHaveProperty('orgName');
});

test('POST /auth/login sets stretto_session cookie', async ({ request }) => {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers['set-cookie']).toContain('stretto_session=');
  expect(headers['set-cookie']).toContain('httponly');
  expect(headers['set-cookie']).toContain('secure');
  expect(headers['set-cookie']).toContain('samesite=strict');
});

test('POST /auth/login with unknown email returns 401', async ({ request }) => {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'notfound@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body).toHaveProperty('message');
});

test('GET /auth/validate with valid cookie returns 200 with user data', async ({ request }) => {
  const loginResp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookieHeader = loginResp.headers()['set-cookie'];
  const token = cookieHeader.match(/stretto_session=([^;]+)/)?.[1];
  expect(token).toBeTruthy();

  const validateResp = await request.get(`${API_BASE}/auth/validate`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(validateResp.status()).toBe(200);
  const body = await validateResp.json();
  expect(body.email).toBe('admin@example.com');
});

test('GET /auth/validate without cookie returns 401', async ({ request }) => {
  const response = await request.get(`${API_BASE}/auth/validate`);
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body).toHaveProperty('message');
});

test('POST /auth/logout with cookie returns 204 and clears cookie', async ({ request }) => {
  const loginResp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookieHeader = loginResp.headers()['set-cookie'];
  const token = cookieHeader.match(/stretto_session=([^;]+)/)?.[1];

  const logoutResp = await request.post(`${API_BASE}/auth/logout`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(logoutResp.status()).toBe(204);
  const logoutCookie = logoutResp.headers()['set-cookie'];
  expect(logoutCookie).toContain('stretto_session=;');
});

test('GET /auth/validate after logout returns 401', async ({ request }) => {
  const loginResp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookieHeader = loginResp.headers()['set-cookie'];
  const token = cookieHeader.match(/stretto_session=([^;]+)/)?.[1];

  await request.post(`${API_BASE}/auth/logout`, {
    headers: { Cookie: `stretto_session=${token}` },
  });

  const validateResp = await request.get(`${API_BASE}/auth/validate`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(validateResp.status()).toBe(401);
});

test('GET /health returns 200', async ({ request }) => {
  const response = await request.get(`${API_BASE}/health`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('healthy');
});
