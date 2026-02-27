import { test, expect, type Page } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://app:8080';
const UI_BASE = process.env.BASE_URL || 'http://frontend:5173';

async function loginAsAdmin(page: Page): Promise<{ token: string; user: any }> {
  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com', password: 'password' },
    headers: { 'Content-Type': 'application/json' },
  });
  const user = await resp.json();
  const cookieHeader = resp.headers()['set-cookie'];
  const token = cookieHeader?.match(/stretto_session=([^;]+)/)?.[1] ?? '';

  await page.context().addCookies([{
    name: 'stretto_session',
    value: token,
    domain: new URL(UI_BASE).hostname,
    path: '/',
    secure: false,
    httpOnly: false,
  }]);

  await page.goto(UI_BASE + '/login');
  await page.evaluate((u) => {
    localStorage.setItem('stretto_user', JSON.stringify(u));
  }, user);

  return { token, user };
}

async function loginAsMember(page: Page): Promise<{ token: string; user: any }> {
  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'member@example.com', password: 'password' },
    headers: { 'Content-Type': 'application/json' },
  });
  const user = await resp.json();
  const cookieHeader = resp.headers()['set-cookie'];
  const token = cookieHeader?.match(/stretto_session=([^;]+)/)?.[1] ?? '';

  await page.context().addCookies([{
    name: 'stretto_session',
    value: token,
    domain: new URL(UI_BASE).hostname,
    path: '/',
    secure: false,
    httpOnly: false,
  }]);

  await page.goto(UI_BASE + '/login');
  await page.evaluate((u) => {
    localStorage.setItem('stretto_user', JSON.stringify(u));
  }, user);

  return { token, user };
}

async function createProject(token: string, page: Page): Promise<string> {
  const pyResp = await page.request.get(`${API_BASE}/api/program-years`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  const pyList = await pyResp.json();
  const py = pyList[0];

  const projResp = await page.request.post(`${API_BASE}/api/projects`, {
    data: { programYearId: py.id, name: 'Materials Test Project', startDate: '2025-10-01', endDate: '2025-12-31' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const project = await projResp.json();
  return project.id;
}

test('Materials tab renders without errors for admin', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const { token } = await loginAsAdmin(page);
  const projectId = await createProject(token, page);

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();
  await expect(page.getByRole('heading', { name: 'Links' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
  expect(errors).toHaveLength(0);
});

test('Admin Materials tab shows add-link form inputs', async ({ page }) => {
  const { token } = await loginAsAdmin(page);
  const projectId = await createProject(token, page);

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  await expect(page.getByTestId('link-title-input')).toBeVisible();
  await expect(page.getByTestId('link-url-input')).toBeVisible();
  await expect(page.getByTestId('add-link-button')).toBeVisible();
});

test('Admin Materials tab shows upload document inputs', async ({ page }) => {
  const { token } = await loginAsAdmin(page);
  const projectId = await createProject(token, page);

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  await expect(page.getByTestId('upload-document-input')).toBeAttached();
  await expect(page.getByTestId('upload-document-button')).toBeVisible();
});

test('Admin can add a link and it appears in the list', async ({ page }) => {
  const { token } = await loginAsAdmin(page);
  const projectId = await createProject(token, page);

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  await page.getByTestId('link-title-input').fill('Sheet Music');
  await page.getByTestId('link-url-input').fill('https://example.com/sheet-music');
  await page.getByTestId('add-link-button').click();

  await expect(page.getByText('Sheet Music')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('No links yet')).not.toBeVisible();
});

test('Admin can delete a link', async ({ page }) => {
  const { token } = await loginAsAdmin(page);
  const projectId = await createProject(token, page);

  // Add a link via API
  const linkResp = await page.request.post(`${API_BASE}/api/projects/${projectId}/links`, {
    data: { title: 'Link To Delete', url: 'https://example.com/delete-me' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const link = await linkResp.json();

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  await expect(page.getByTestId(`delete-link-${link.id}`)).toBeVisible({ timeout: 5000 });

  page.on('dialog', (d) => d.accept());
  await page.getByTestId(`delete-link-${link.id}`).click();

  await expect(page.getByTestId(`delete-link-${link.id}`)).not.toBeVisible({ timeout: 5000 });
});

test('Document row has download anchor pointing to correct URL', async ({ page }) => {
  const { token } = await loginAsAdmin(page);
  const projectId = await createProject(token, page);

  // Upload a document via Playwright request API (multipart)
  const docResp = await page.request.post(`${API_BASE}/api/projects/${projectId}/documents`, {
    headers: { Cookie: `stretto_session=${token}` },
    multipart: {
      title: 'Test Doc',
      file: {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('hello world'),
      },
    },
  });
  const docResult = await docResp.json();

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  const anchor = page.getByTestId(`download-document-${docResult.id}`);
  await expect(anchor).toBeVisible({ timeout: 5000 });

  const href = await anchor.getAttribute('href');
  expect(href).toContain(`/api/projects/${projectId}/documents/${docResult.id}/download`);
});

test('Admin can delete a document', async ({ page }) => {
  const { token } = await loginAsAdmin(page);
  const projectId = await createProject(token, page);

  const docResp = await page.request.post(`${API_BASE}/api/projects/${projectId}/documents`, {
    headers: { Cookie: `stretto_session=${token}` },
    multipart: {
      title: 'Doc To Delete',
      file: {
        name: 'delete.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('content to delete'),
      },
    },
  });
  const docResult = await docResp.json();

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  await expect(page.getByTestId(`delete-document-${docResult.id}`)).toBeVisible({ timeout: 5000 });

  page.on('dialog', (d) => d.accept());
  await page.getByTestId(`delete-document-${docResult.id}`).click();

  await expect(page.getByTestId(`delete-document-${docResult.id}`)).not.toBeVisible({ timeout: 5000 });
});

test('Member session: Materials tab shows links but no add-link form', async ({ page }) => {
  const { token: adminToken } = await loginAsAdmin(page);
  const projectId = await createProject(adminToken, page);

  // Add a link as admin
  await page.request.post(`${API_BASE}/api/projects/${projectId}/links`, {
    data: { title: 'Member Visible Link', url: 'https://example.com/member-link' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${adminToken}` },
  });

  // Now login as member
  await loginAsMember(page);

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  // Should see links
  await expect(page.getByText('Member Visible Link')).toBeVisible({ timeout: 5000 });

  // Should NOT see add-link form
  await expect(page.getByTestId('link-title-input')).not.toBeVisible();
  await expect(page.getByTestId('add-link-button')).not.toBeVisible();
});

test('Member session: No delete buttons visible', async ({ page }) => {
  const { token: adminToken } = await loginAsAdmin(page);
  const projectId = await createProject(adminToken, page);

  const linkResp = await page.request.post(`${API_BASE}/api/projects/${projectId}/links`, {
    data: { title: 'Some Link', url: 'https://example.com/some' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${adminToken}` },
  });
  const link = await linkResp.json();

  await loginAsMember(page);

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  await expect(page.getByText('Some Link')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId(`delete-link-${link.id}`)).not.toBeVisible();
});

test('Empty state shows "No links yet" and "No documents yet"', async ({ page }) => {
  const { token } = await loginAsAdmin(page);
  const projectId = await createProject(token, page);

  await page.goto(`${UI_BASE}/projects/${projectId}`);
  await page.getByTestId('tab-materials').click();

  await expect(page.getByText('No links yet')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('No documents yet')).toBeVisible({ timeout: 5000 });
});
