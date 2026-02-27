import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://app:8080';

async function loginAsAdmin(request: any): Promise<string> {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com' },
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = resp.headers()['set-cookie'];
  const token = cookie?.match(/stretto_session=([^;]+)/)?.[1]!;
  return token;
}

async function createProgramYear(request: any, token: string): Promise<string> {
  const resp = await request.post(`${API_BASE}/api/program-years`, {
    data: { name: 'Test Year', startDate: '2026-09-01', endDate: '2027-06-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const body = await resp.json();
  return body.id;
}

async function createProject(request: any, token: string, programYearId: string): Promise<string> {
  const resp = await request.post(`${API_BASE}/api/projects`, {
    data: { name: 'Test Project', programYearId, startDate: '2026-09-10', endDate: '2027-05-30' },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  const body = await resp.json();
  return body.id;
}

async function getFirstMemberId(request: any, token: string): Promise<string> {
  const resp = await request.get(`${API_BASE}/api/members`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  const body = await resp.json();
  return body[0].id;
}

test('GET /api/projects/{id}/members returns 200 with array of members with required fields', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const pyId = await createProgramYear(request, token);
  const projectId = await createProject(request, token, pyId);

  const resp = await request.get(`${API_BASE}/api/projects/${projectId}/members`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);

  const member = body[0];
  expect(member).toHaveProperty('memberId');
  expect(member).toHaveProperty('fullName');
  expect(member).toHaveProperty('email');
  expect(member).toHaveProperty('isAssigned');
  expect(member.isAssigned).toBe(false);
});

test('POST /api/projects/{id}/members returns 201 when member is not yet assigned', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const pyId = await createProgramYear(request, token);
  const projectId = await createProject(request, token, pyId);
  const memberId = await getFirstMemberId(request, token);

  const resp = await request.post(`${API_BASE}/api/projects/${projectId}/members`, {
    data: { memberId },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(201);
});

test('GET /api/projects/{id}/members shows isAssigned=true after assignment', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const pyId = await createProgramYear(request, token);
  const projectId = await createProject(request, token, pyId);
  const memberId = await getFirstMemberId(request, token);

  await request.post(`${API_BASE}/api/projects/${projectId}/members`, {
    data: { memberId },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });

  const resp = await request.get(`${API_BASE}/api/projects/${projectId}/members`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  const found = body.find((m: any) => m.memberId === memberId);
  expect(found).toBeTruthy();
  expect(found.isAssigned).toBe(true);
});

test('DELETE /api/projects/{id}/members/{memberId} returns 204 when assignment exists', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const pyId = await createProgramYear(request, token);
  const projectId = await createProject(request, token, pyId);
  const memberId = await getFirstMemberId(request, token);

  await request.post(`${API_BASE}/api/projects/${projectId}/members`, {
    data: { memberId },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });

  const resp = await request.delete(`${API_BASE}/api/projects/${projectId}/members/${memberId}`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(204);
});

test('GET /api/projects/{nonExistentId}/members returns 404', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const fakeId = '00000000-0000-0000-0000-000000000099';

  const resp = await request.get(`${API_BASE}/api/projects/${fakeId}/members`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(404);
});

test('GET /api/program-years/{id}/utilization returns 200 with projects and members', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const pyId = await createProgramYear(request, token);
  const projectId = await createProject(request, token, pyId);
  const memberId = await getFirstMemberId(request, token);

  await request.post(`${API_BASE}/api/projects/${projectId}/members`, {
    data: { memberId },
    headers: { 'Content-Type': 'application/json', Cookie: `stretto_session=${token}` },
  });

  const resp = await request.get(`${API_BASE}/api/program-years/${pyId}/utilization`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body).toHaveProperty('projects');
  expect(body).toHaveProperty('members');
  expect(Array.isArray(body.projects)).toBe(true);
  expect(Array.isArray(body.members)).toBe(true);

  const assignedMember = body.members.find((m: any) => m.memberId === memberId);
  expect(assignedMember).toBeTruthy();
  expect(assignedMember.assignedCount).toBe(1);
  expect(assignedMember.totalProjects).toBe(1);
  expect(assignedMember.assignedProjectIds).toContain(projectId);
});

test('GET /api/program-years/{nonExistentId}/utilization returns 404', async ({ request }) => {
  const token = await loginAsAdmin(request);
  const fakeId = '00000000-0000-0000-0000-000000000099';

  const resp = await request.get(`${API_BASE}/api/program-years/${fakeId}/utilization`, {
    headers: { Cookie: `stretto_session=${token}` },
  });
  expect(resp.status()).toBe(404);
});
