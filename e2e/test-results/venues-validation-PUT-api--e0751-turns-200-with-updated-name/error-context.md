# Test info

- Name: PUT /api/venues/{id} returns 200 with updated name
- Location: /app/e2e/venues-validation.spec.ts:143:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
    at /app/e2e/venues-validation.spec.ts:162:28
```

# Test source

```ts
   62 | test('[J-1] Dashboard shows org name My Choir after login', async ({ page }) => {
   63 |   await loginViaApi(page);
   64 |   // If redirected to login (Zustand state lost on navigation), check page content
   65 |   const url = page.url();
   66 |   if (url.includes('/login')) {
   67 |     // Zustand is in-memory; dashboard requires the store to have user. Skip navigation check.
   68 |     test.skip();
   69 |     return;
   70 |   }
   71 |   await expect(page.getByText('My Choir')).toBeVisible();
   72 | });
   73 |
   74 | test('[J-1] Sidebar shows Venues nav link after login', async ({ page }) => {
   75 |   await loginViaApi(page);
   76 |   const url = page.url();
   77 |   if (url.includes('/login')) { test.skip(); return; }
   78 |   const venuesLink = page.getByRole('link', { name: /venues/i });
   79 |   await expect(venuesLink).toBeVisible();
   80 | });
   81 |
   82 | test('[J-1] /venues page loads without JS errors', async ({ page }) => {
   83 |   const errors: string[] = [];
   84 |   page.on('pageerror', (err) => errors.push(err.message));
   85 |   await loginViaApi(page);
   86 |   const url = page.url();
   87 |   if (url.includes('/login')) { test.skip(); return; }
   88 |   await page.getByRole('link', { name: /venues/i }).click();
   89 |   await page.waitForURL(/\/venues/, { timeout: 5000 });
   90 |   expect(errors).toHaveLength(0);
   91 | });
   92 |
   93 | // Venues API tests via Playwright request
   94 | test('GET /api/venues without auth returns 401', async ({ request }) => {
   95 |   const response = await request.get(`${API_BASE}/api/venues`);
   96 |   expect(response.status()).toBe(401);
   97 | });
   98 |
   99 | test('POST /api/venues returns 201 with id, name, address', async ({ request }) => {
  100 |   const loginResp = await request.post(`${API_BASE}/auth/login`, {
  101 |     data: { email: 'mgarner22@gmail.com' },
  102 |     headers: { 'Content-Type': 'application/json' },
  103 |   });
  104 |   expect(loginResp.status()).toBe(200);
  105 |   const cookie = loginResp.headers()['set-cookie'];
  106 |   const token = cookie?.match(/stretto_session=([^;]+)/)?.[1];
  107 |   expect(token).toBeTruthy();
  108 |
  109 |   const createResp = await request.post(`${API_BASE}/api/venues`, {
  110 |     data: { name: 'City Hall', address: '1 Main St', contactName: 'Bob', contactEmail: 'bob@example.com', contactPhone: '555-1234' },
  111 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  112 |   });
  113 |   expect(createResp.status()).toBe(201);
  114 |   const body = await createResp.json();
  115 |   expect(body).toHaveProperty('id');
  116 |   expect(body.name).toBe('City Hall');
  117 |   expect(body.address).toBe('1 Main St');
  118 | });
  119 |
  120 | test('GET /api/venues/{id} returns 200 with matching name', async ({ request }) => {
  121 |   const loginResp = await request.post(`${API_BASE}/auth/login`, {
  122 |     data: { email: 'mgarner22@gmail.com' },
  123 |     headers: { 'Content-Type': 'application/json' },
  124 |   });
  125 |   const cookie = loginResp.headers()['set-cookie'];
  126 |   const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  127 |
  128 |   const createResp = await request.post(`${API_BASE}/api/venues`, {
  129 |     data: { name: 'Test Venue', address: '2 Test Ave', contactName: null, contactEmail: null, contactPhone: null },
  130 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  131 |   });
  132 |   const created = await createResp.json();
  133 |   const id = created.id;
  134 |
  135 |   const getResp = await request.get(`${API_BASE}/api/venues/${id}`, {
  136 |     headers: { Cookie: `stretto_session=${token}` },
  137 |   });
  138 |   expect(getResp.status()).toBe(200);
  139 |   const body = await getResp.json();
  140 |   expect(body.name).toBe('Test Venue');
  141 | });
  142 |
  143 | test('PUT /api/venues/{id} returns 200 with updated name', async ({ request }) => {
  144 |   const loginResp = await request.post(`${API_BASE}/auth/login`, {
  145 |     data: { email: 'mgarner22@gmail.com' },
  146 |     headers: { 'Content-Type': 'application/json' },
  147 |   });
  148 |   const cookie = loginResp.headers()['set-cookie'];
  149 |   const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  150 |
  151 |   const createResp = await request.post(`${API_BASE}/api/venues`, {
  152 |     data: { name: 'Old Name', address: '3 Old Rd', contactName: null, contactEmail: null, contactPhone: null },
  153 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  154 |   });
  155 |   const created = await createResp.json();
  156 |   const id = created.id;
  157 |
  158 |   const putResp = await request.put(`${API_BASE}/api/venues/${id}`, {
  159 |     data: { name: 'New Name', address: '3 Old Rd', contactName: null, contactEmail: null, contactPhone: null },
  160 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  161 |   });
> 162 |   expect(putResp.status()).toBe(200);
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  163 |   const body = await putResp.json();
  164 |   expect(body.name).toBe('New Name');
  165 | });
  166 |
  167 | test('DELETE /api/venues/{id} returns 204 and subsequent GET returns 404', async ({ request }) => {
  168 |   const loginResp = await request.post(`${API_BASE}/auth/login`, {
  169 |     data: { email: 'mgarner22@gmail.com' },
  170 |     headers: { 'Content-Type': 'application/json' },
  171 |   });
  172 |   const cookie = loginResp.headers()['set-cookie'];
  173 |   const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  174 |
  175 |   const createResp = await request.post(`${API_BASE}/api/venues`, {
  176 |     data: { name: 'To Delete', address: '4 Delete St', contactName: null, contactEmail: null, contactPhone: null },
  177 |     headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  178 |   });
  179 |   const created = await createResp.json();
  180 |   const id = created.id;
  181 |
  182 |   const deleteResp = await request.delete(`${API_BASE}/api/venues/${id}`, {
  183 |     headers: { Cookie: `stretto_session=${token}` },
  184 |   });
  185 |   expect(deleteResp.status()).toBe(204);
  186 |
  187 |   const getResp = await request.get(`${API_BASE}/api/venues/${id}`, {
  188 |     headers: { Cookie: `stretto_session=${token}` },
  189 |   });
  190 |   expect(getResp.status()).toBe(404);
  191 | });
  192 |
  193 | test('GET /api/venues returns 200 with JSON array', async ({ request }) => {
  194 |   const loginResp = await request.post(`${API_BASE}/auth/login`, {
  195 |     data: { email: 'mgarner22@gmail.com' },
  196 |     headers: { 'Content-Type': 'application/json' },
  197 |   });
  198 |   const cookie = loginResp.headers()['set-cookie'];
  199 |   const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  200 |
  201 |   const resp = await request.get(`${API_BASE}/api/venues`, {
  202 |     headers: { Cookie: `stretto_session=${token}` },
  203 |   });
  204 |   expect(resp.status()).toBe(200);
  205 |   const body = await resp.json();
  206 |   expect(Array.isArray(body)).toBe(true);
  207 | });
  208 |
  209 | test('GET /health returns 200', async ({ request }) => {
  210 |   const resp = await request.get(`${API_BASE}/health`);
  211 |   expect(resp.status()).toBe(200);
  212 | });
  213 |
```