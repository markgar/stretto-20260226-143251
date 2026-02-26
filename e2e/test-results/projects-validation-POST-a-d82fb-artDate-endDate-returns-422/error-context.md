# Test info

- Name: POST /api/projects with startDate >= endDate returns 422
- Location: /app/e2e/projects-validation.spec.ts:116:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 422
Received: 400
    at /app/e2e/projects-validation.spec.ts:122:25
```

# Test source

```ts
   22 |   const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
   23 |   return token;
   24 | }
   25 |
   26 | // [J-1] Smoke: Login and Navigate the App Shell
   27 | test('[J-1] J-1: GET /health returns 200', async ({ request }) => {
   28 |   const resp = await request.get(`${API_BASE}/health`);
   29 |   expect(resp.status()).toBe(200);
   30 | });
   31 |
   32 | test('[J-1] J-1: Login returns 200 with user fields', async ({ request }) => {
   33 |   const resp = await request.post(`${API_BASE}/auth/login`, {
   34 |     data: { email: 'admin@example.com' },
   35 |     headers: { 'Content-Type': 'application/json' },
   36 |   });
   37 |   expect(resp.status()).toBe(200);
   38 |   const body = await resp.json();
   39 |   expect(body.email).toBe('admin@example.com');
   40 |   expect(body.role).toBe('Admin');
   41 |   expect(body.orgName).toBe('My Choir');
   42 | });
   43 |
   44 | // Projects API Tests
   45 | test('GET /api/projects without auth returns 401', async ({ request }) => {
   46 |   const resp = await request.get(`${API_BASE}/api/projects?programYearId=${PY_ID}`);
   47 |   expect(resp.status()).toBe(401);
   48 | });
   49 |
   50 | test('POST /api/projects as admin returns 201 with project fields', async ({ request }) => {
   51 |   const token = await loginAsAdmin(request);
   52 |   const resp = await request.post(`${API_BASE}/api/projects`, {
   53 |     data: { programYearId: PY_ID, name: 'Spring Concert', startDate: '2025-09-01', endDate: '2026-06-30' },
   54 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
   55 |   });
   56 |   expect(resp.status()).toBe(201);
   57 |   const body = await resp.json();
   58 |   expect(body.id).toBeTruthy();
   59 |   expect(body.name).toBe('Spring Concert');
   60 |   expect(body.programYearId).toBe(PY_ID);
   61 |   expect(body.startDate).toBe('2025-09-01');
   62 |   expect(body.endDate).toBe('2026-06-30');
   63 | });
   64 |
   65 | test('GET /api/projects?programYearId=... returns 200 with array containing created project', async ({ request }) => {
   66 |   const token = await loginAsAdmin(request);
   67 |   const createResp = await request.post(`${API_BASE}/api/projects`, {
   68 |     data: { programYearId: PY_ID, name: 'Test Project List', startDate: '2025-09-01', endDate: '2026-06-30' },
   69 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
   70 |   });
   71 |   const created = await createResp.json();
   72 |
   73 |   const listResp = await request.get(`${API_BASE}/api/projects?programYearId=${PY_ID}`, {
   74 |     headers: { Cookie: `stretto_session=${token}` },
   75 |   });
   76 |   expect(listResp.status()).toBe(200);
   77 |   const body = await listResp.json();
   78 |   expect(Array.isArray(body)).toBe(true);
   79 |   const found = body.find((p: any) => p.id === created.id);
   80 |   expect(found).toBeTruthy();
   81 | });
   82 |
   83 | test('GET /api/projects/{id} returns 200 with matching name', async ({ request }) => {
   84 |   const token = await loginAsAdmin(request);
   85 |   const createResp = await request.post(`${API_BASE}/api/projects`, {
   86 |     data: { programYearId: PY_ID, name: 'Get By ID Project', startDate: '2025-09-01', endDate: '2026-06-30' },
   87 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
   88 |   });
   89 |   const created = await createResp.json();
   90 |
   91 |   const getResp = await request.get(`${API_BASE}/api/projects/${created.id}`, {
   92 |     headers: { Cookie: `stretto_session=${token}` },
   93 |   });
   94 |   expect(getResp.status()).toBe(200);
   95 |   const body = await getResp.json();
   96 |   expect(body.name).toBe('Get By ID Project');
   97 | });
   98 |
   99 | test('PUT /api/projects/{id} returns 200 with updated name', async ({ request }) => {
  100 |   const token = await loginAsAdmin(request);
  101 |   const createResp = await request.post(`${API_BASE}/api/projects`, {
  102 |     data: { programYearId: PY_ID, name: 'Spring Concert', startDate: '2025-09-01', endDate: '2026-06-30' },
  103 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  104 |   });
  105 |   const created = await createResp.json();
  106 |
  107 |   const putResp = await request.put(`${API_BASE}/api/projects/${created.id}`, {
  108 |     data: { name: 'Spring Gala', startDate: '2025-09-01', endDate: '2026-06-30' },
  109 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  110 |   });
  111 |   expect(putResp.status()).toBe(200);
  112 |   const body = await putResp.json();
  113 |   expect(body.name).toBe('Spring Gala');
  114 | });
  115 |
  116 | test('POST /api/projects with startDate >= endDate returns 422', async ({ request }) => {
  117 |   const token = await loginAsAdmin(request);
  118 |   const resp = await request.post(`${API_BASE}/api/projects`, {
  119 |     data: { programYearId: PY_ID, name: 'Bad Dates', startDate: '2026-06-30', endDate: '2025-09-01' },
  120 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  121 |   });
> 122 |   expect(resp.status()).toBe(422);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  123 | });
  124 |
  125 | test('DELETE /api/projects/{id} returns 204 and subsequent GET returns 404', async ({ request }) => {
  126 |   const token = await loginAsAdmin(request);
  127 |   const createResp = await request.post(`${API_BASE}/api/projects`, {
  128 |     data: { programYearId: PY_ID, name: 'To Delete', startDate: '2025-09-01', endDate: '2026-06-30' },
  129 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  130 |   });
  131 |   const created = await createResp.json();
  132 |
  133 |   const delResp = await request.delete(`${API_BASE}/api/projects/${created.id}`, {
  134 |     headers: { Cookie: `stretto_session=${token}` },
  135 |   });
  136 |   expect(delResp.status()).toBe(204);
  137 |
  138 |   const getResp = await request.get(`${API_BASE}/api/projects/${created.id}`, {
  139 |     headers: { Cookie: `stretto_session=${token}` },
  140 |   });
  141 |   expect(getResp.status()).toBe(404);
  142 | });
  143 |
  144 | test('POST /api/projects as Member returns 403', async ({ request }) => {
  145 |   const token = await loginAsMember(request);
  146 |   const resp = await request.post(`${API_BASE}/api/projects`, {
  147 |     data: { programYearId: PY_ID, name: 'Member Project', startDate: '2025-09-01', endDate: '2026-06-30' },
  148 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  149 |   });
  150 |   expect(resp.status()).toBe(403);
  151 | });
  152 |
  153 | // UI Smoke: J-1 App Shell Navigation
  154 | test('[J-1] Login page renders and redirects to dashboard', async ({ page }) => {
  155 |   const errors: string[] = [];
  156 |   page.on('pageerror', (err) => errors.push(err.message));
  157 |
  158 |   await page.goto('/login');
  159 |   const emailInput = page.getByTestId('email-input');
  160 |   await expect(emailInput).toBeVisible();
  161 |   await emailInput.fill('admin@example.com');
  162 |   await page.getByTestId('login-button').click();
  163 |   await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  164 |   expect(errors).toHaveLength(0);
  165 | });
  166 |
  167 | test('[J-1] Sidebar shows organization name My Choir after login', async ({ page }) => {
  168 |   await page.goto('/login');
  169 |   await page.getByTestId('email-input').fill('admin@example.com');
  170 |   await page.getByTestId('login-button').click();
  171 |   await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  172 |   await expect(page.getByText('My Choir')).toBeVisible();
  173 | });
  174 |
  175 | test('[J-1] Sidebar shows Projects nav link after login', async ({ page }) => {
  176 |   await page.goto('/login');
  177 |   await page.getByTestId('email-input').fill('admin@example.com');
  178 |   await page.getByTestId('login-button').click();
  179 |   await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  180 |   // Nav uses nav-desktop-{label} pattern (see AppShell.tsx)
  181 |   const projectsNav = page.getByTestId('nav-desktop-projects');
  182 |   await expect(projectsNav).toBeVisible();
  183 | });
  184 |
  185 | test('[J-1] Unauthenticated access to dashboard redirects to login', async ({ page }) => {
  186 |   await page.goto('/dashboard');
  187 |   await page.waitForURL(/\/login/, { timeout: 10000 });
  188 |   const url = page.url();
  189 |   expect(url).toContain('/login');
  190 | });
  191 |
```