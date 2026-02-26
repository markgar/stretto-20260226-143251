import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://app:8080';
const PY_ID = '22222222-2222-2222-2222-222222222222';

async function loginAsAdmin(request: any): Promise<string> {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = resp.headers()['set-cookie'];
  const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  return token;
}

async function loginAsMember(request: any): Promise<string> {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'member@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = resp.headers()['set-cookie'];
  const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  return token;
}

async function createProject(request: any, token: string): Promise<string> {
  const resp = await request.post(`${API_BASE}/api/projects`, {
    data: {
      programYearId: PY_ID,
      name: 'Materials Test Project ' + Date.now(),
      startDate: '2025-10-01',
      endDate: '2026-05-01',
    },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const body = await resp.json();
  return body.id;
}

// ── Links ──────────────────────────────────────────────────────────────────

test('[13a] GET /api/projects/{id}/links without auth returns 401', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/api/projects/00000000-0000-0000-0000-000000000001/links`);
  expect(resp.status()).toBe(401);
});

test('[13a] POST /api/projects/{id}/links as admin returns 201 with link fields', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const resp = await request.post(`${API_BASE}/api/projects/${projectId}/links`, {
    data: { title: 'Score', url: 'https://example.com' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(201);
  const body = await resp.json();
  expect(body.id).toBeTruthy();
  expect(body.projectId).toBe(projectId);
  expect(body.title).toBe('Score');
  expect(body.url).toBe('https://example.com');
});

test('[13a] GET /api/projects/{id}/links as admin returns 200 with array', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  // Add a link
  await request.post(`${API_BASE}/api/projects/${projectId}/links`, {
    data: { title: 'Score', url: 'https://example.com' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });

  const resp = await request.get(`${API_BASE}/api/projects/${projectId}/links`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);
});

test('[13a] GET /api/projects/{id}/links as member returns 200', async ({ request }) => {
  const adminToken = await loginAsAdmin(request);
  const projectId = await createProject(request, adminToken);
  await request.post(`${API_BASE}/api/projects/${projectId}/links`, {
    data: { title: 'Score', url: 'https://example.com' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${adminToken}` },
  });

  const memberToken = await loginAsMember(request);
  const resp = await request.get(`${API_BASE}/api/projects/${projectId}/links`, {
    headers: { Cookie: `stretto_session=${memberToken}` },
  });
  expect(resp.status()).toBe(200);
});

test('[13a] DELETE /api/projects/{id}/links/{linkId} as admin returns 204', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const postResp = await request.post(`${API_BASE}/api/projects/${projectId}/links`, {
    data: { title: 'Score', url: 'https://example.com' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const link = await postResp.json();

  const delResp = await request.delete(`${API_BASE}/api/projects/${projectId}/links/${link.id}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(delResp.status()).toBe(204);

  // Verify gone
  const getResp = await request.get(`${API_BASE}/api/projects/${projectId}/links`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  const remaining = await getResp.json();
  expect(remaining.find((l: any) => l.id === link.id)).toBeUndefined();
});

test('[13a] DELETE /api/projects/{id}/links/{linkId} as member returns 403', async ({ request }) => {
  const adminToken = await loginAsAdmin(request);
  const projectId = await createProject(request, adminToken);
  const postResp = await request.post(`${API_BASE}/api/projects/${projectId}/links`, {
    data: { title: 'Score', url: 'https://example.com' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${adminToken}` },
  });
  const link = await postResp.json();

  const memberToken = await loginAsMember(request);
  const delResp = await request.delete(`${API_BASE}/api/projects/${projectId}/links/${link.id}`, {
    headers: { Cookie: `stretto_session=${memberToken}` },
  });
  expect(delResp.status()).toBe(403);
});

// ── Documents ──────────────────────────────────────────────────────────────

test('[13a] POST /api/projects/{id}/documents as admin returns 201 with document fields', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const resp = await request.post(`${API_BASE}/api/projects/${projectId}/documents`, {
    headers: { Cookie: `stretto_session=${token}` },
    multipart: {
      title: 'Rehearsal Notes',
      file: {
        name: 'notes.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Hello world'),
      },
    },
  });
  expect(resp.status()).toBe(201);
  const body = await resp.json();
  expect(body.id).toBeTruthy();
  expect(body.projectId).toBe(projectId);
  expect(body.title).toBe('Rehearsal Notes');
  expect(body.fileName).toBe('notes.txt');
});

test('[13a] GET /api/projects/{id}/documents returns 200 with array', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  await request.post(`${API_BASE}/api/projects/${projectId}/documents`, {
    headers: { Cookie: `stretto_session=${token}` },
    multipart: {
      title: 'Notes',
      file: { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('content') },
    },
  });

  const resp = await request.get(`${API_BASE}/api/projects/${projectId}/documents`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);
});

test('[13a] GET /api/projects/{id}/documents/{docId}/download returns 200 with attachment header', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const uploadResp = await request.post(`${API_BASE}/api/projects/${projectId}/documents`, {
    headers: { Cookie: `stretto_session=${token}` },
    multipart: {
      title: 'Notes',
      file: { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('content') },
    },
  });
  const doc = await uploadResp.json();

  const downloadResp = await request.get(`${API_BASE}/api/projects/${projectId}/documents/${doc.id}/download`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(downloadResp.status()).toBe(200);
  const contentDisp = downloadResp.headers()['content-disposition'] || '';
  expect(contentDisp).toContain('attachment');
});

test('[13a] DELETE /api/projects/{id}/documents/{docId} as admin returns 204', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const projectId = await createProject(request, token);

  const uploadResp = await request.post(`${API_BASE}/api/projects/${projectId}/documents`, {
    headers: { Cookie: `stretto_session=${token}` },
    multipart: {
      title: 'Notes',
      file: { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('content') },
    },
  });
  const doc = await uploadResp.json();

  const delResp = await request.delete(`${API_BASE}/api/projects/${projectId}/documents/${doc.id}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(delResp.status()).toBe(204);

  // Verify gone
  const getResp = await request.get(`${API_BASE}/api/projects/${projectId}/documents`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  const remaining = await getResp.json();
  expect(remaining.find((d: any) => d.id === doc.id)).toBeUndefined();
});

test('[13a] GET /api/projects/{id}/documents without auth returns 401', async ({ request }) => {
  const resp = await request.get(`${API_BASE}/api/projects/00000000-0000-0000-0000-000000000001/documents`);
  expect(resp.status()).toBe(401);
});
