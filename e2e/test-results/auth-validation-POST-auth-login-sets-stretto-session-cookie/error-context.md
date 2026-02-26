# Test info

- Name: POST /auth/login sets stretto_session cookie
- Location: /app/e2e/auth-validation.spec.ts:21:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
    at /app/e2e/auth-validation.spec.ts:26:29
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | const API_BASE = process.env.API_URL || 'http://app:8080';
   4 |
   5 | test('POST /auth/login with valid email returns 200 with user fields', async ({ request }) => {
   6 |   const response = await request.post(`${API_BASE}/auth/login`, {
   7 |     data: { email: 'admin@example.com' },
   8 |     headers: { 'Content-Type': 'application/json' },
   9 |   });
   10 |   expect(response.status()).toBe(200);
   11 |   const body = await response.json();
   12 |   expect(body).toHaveProperty('id');
   13 |   expect(body).toHaveProperty('email');
   14 |   expect(body).toHaveProperty('firstName');
   15 |   expect(body).toHaveProperty('lastName');
   16 |   expect(body).toHaveProperty('role');
   17 |   expect(body).toHaveProperty('orgId');
   18 |   expect(body).toHaveProperty('orgName');
   19 | });
   20 |
   21 | test('POST /auth/login sets stretto_session cookie', async ({ request }) => {
   22 |   const response = await request.post(`${API_BASE}/auth/login`, {
   23 |     data: { email: 'admin@example.com' },
   24 |     headers: { 'Content-Type': 'application/json' },
   25 |   });
>  26 |   expect(response.status()).toBe(200);
      |                             ^ Error: expect(received).toBe(expected) // Object.is equality
   27 |   const headers = response.headers();
   28 |   expect(headers['set-cookie']).toContain('stretto_session=');
   29 |   expect(headers['set-cookie']).toContain('httponly');
   30 |   expect(headers['set-cookie']).toContain('secure');
   31 |   expect(headers['set-cookie']).toContain('samesite=strict');
   32 | });
   33 |
   34 | test('POST /auth/login with unknown email returns 401', async ({ request }) => {
   35 |   const response = await request.post(`${API_BASE}/auth/login`, {
   36 |     data: { email: 'notfound@example.com' },
   37 |     headers: { 'Content-Type': 'application/json' },
   38 |   });
   39 |   expect(response.status()).toBe(401);
   40 |   const body = await response.json();
   41 |   expect(body).toHaveProperty('message');
   42 | });
   43 |
   44 | test('GET /auth/validate with valid cookie returns 200 with user data', async ({ request }) => {
   45 |   const loginResp = await request.post(`${API_BASE}/auth/login`, {
   46 |     data: { email: 'admin@example.com' },
   47 |     headers: { 'Content-Type': 'application/json' },
   48 |   });
   49 |   const cookieHeader = loginResp.headers()['set-cookie'];
   50 |   const token = cookieHeader.match(/stretto_session=([^;]+)/)?.[1];
   51 |   expect(token).toBeTruthy();
   52 |
   53 |   const validateResp = await request.get(`${API_BASE}/auth/validate`, {
   54 |     headers: { Cookie: `stretto_session=${token}` },
   55 |   });
   56 |   expect(validateResp.status()).toBe(200);
   57 |   const body = await validateResp.json();
   58 |   expect(body.email).toBe('admin@example.com');
   59 | });
   60 |
   61 | test('GET /auth/validate without cookie returns 401', async ({ request }) => {
   62 |   const response = await request.get(`${API_BASE}/auth/validate`);
   63 |   expect(response.status()).toBe(401);
   64 |   const body = await response.json();
   65 |   expect(body).toHaveProperty('message');
   66 | });
   67 |
   68 | test('POST /auth/logout with cookie returns 204 and clears cookie', async ({ request }) => {
   69 |   const loginResp = await request.post(`${API_BASE}/auth/login`, {
   70 |     data: { email: 'admin@example.com' },
   71 |     headers: { 'Content-Type': 'application/json' },
   72 |   });
   73 |   const cookieHeader = loginResp.headers()['set-cookie'];
   74 |   const token = cookieHeader.match(/stretto_session=([^;]+)/)?.[1];
   75 |
   76 |   const logoutResp = await request.post(`${API_BASE}/auth/logout`, {
   77 |     headers: { Cookie: `stretto_session=${token}` },
   78 |   });
   79 |   expect(logoutResp.status()).toBe(204);
   80 |   const logoutCookie = logoutResp.headers()['set-cookie'];
   81 |   expect(logoutCookie).toContain('stretto_session=;');
   82 | });
   83 |
   84 | test('GET /auth/validate after logout returns 401', async ({ request }) => {
   85 |   const loginResp = await request.post(`${API_BASE}/auth/login`, {
   86 |     data: { email: 'admin@example.com' },
   87 |     headers: { 'Content-Type': 'application/json' },
   88 |   });
   89 |   const cookieHeader = loginResp.headers()['set-cookie'];
   90 |   const token = cookieHeader.match(/stretto_session=([^;]+)/)?.[1];
   91 |
   92 |   await request.post(`${API_BASE}/auth/logout`, {
   93 |     headers: { Cookie: `stretto_session=${token}` },
   94 |   });
   95 |
   96 |   const validateResp = await request.get(`${API_BASE}/auth/validate`, {
   97 |     headers: { Cookie: `stretto_session=${token}` },
   98 |   });
   99 |   expect(validateResp.status()).toBe(401);
  100 | });
  101 |
  102 | test('GET /health returns 200', async ({ request }) => {
  103 |   const response = await request.get(`${API_BASE}/health`);
  104 |   expect(response.status()).toBe(200);
  105 |   const body = await response.json();
  106 |   expect(body.status).toBe('healthy');
  107 | });
  108 |
```