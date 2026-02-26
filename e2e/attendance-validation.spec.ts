import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || 'http://app:8080';

async function loginAdmin(request: any) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@example.com', password: 'password' },
  });
  expect(res.status()).toBe(200);
  return res;
}

async function loginMember(request: any) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'member@example.com', password: 'password' },
  });
  expect(res.status()).toBe(200);
  return res;
}

async function getAdminCookieHeader(request: any): Promise<string> {
  const res = await loginAdmin(request);
  const setCookie = res.headers()['set-cookie'] || '';
  const match = setCookie.match(/stretto_session=([^;]+)/);
  return match ? `stretto_session=${match[1]}` : '';
}

async function getMemberCookieHeader(request: any): Promise<string> {
  const res = await loginMember(request);
  const setCookie = res.headers()['set-cookie'] || '';
  const match = setCookie.match(/stretto_session=([^;]+)/);
  return match ? `stretto_session=${match[1]}` : '';
}

async function createProjectAndEvent(request: any, cookie: string): Promise<string> {
  const project = await request.post(`${API_BASE}/api/projects`, {
    data: {
      programYearId: '22222222-2222-2222-2222-222222222222',
      name: `Attendance Test ${Date.now()}`,
      startDate: '2025-10-01',
      endDate: '2025-12-01',
    },
    headers: { Cookie: cookie },
  });
  const projectData = await project.json();
  const event = await request.post(`${API_BASE}/api/events`, {
    data: {
      projectId: projectData.id,
      type: 0,
      date: '2025-11-15',
      startTime: '18:00:00',
      durationMinutes: 90,
    },
    headers: { Cookie: cookie },
  });
  const eventData = await event.json();
  return eventData.id;
}

test('GET /health returns 200 with status healthy', async ({ request }) => {
  const res = await request.get(`${API_BASE}/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('healthy');
});

test('GET /api/events/{id}/attendance without session returns 401', async ({ request }) => {
  const res = await request.get(`${API_BASE}/api/events/00000000-0000-0000-0000-000000000001/attendance`);
  expect(res.status()).toBe(401);
});

test('GET /api/events/{id}/attendance with admin session returns 200 array', async ({ request }) => {
  const cookie = await getAdminCookieHeader(request);
  const eventId = await createProjectAndEvent(request, cookie);
  const res = await request.get(`${API_BASE}/api/events/${eventId}/attendance`, {
    headers: { Cookie: cookie },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
});

test('PUT /api/events/{id}/attendance/{memberId} with admin session returns 200', async ({ request }) => {
  const cookie = await getAdminCookieHeader(request);
  const eventId = await createProjectAndEvent(request, cookie);
  const membersRes = await request.get(`${API_BASE}/api/members`, {
    headers: { Cookie: cookie },
  });
  const members = await membersRes.json();
  const memberId = members[0].id;

  const res = await request.put(`${API_BASE}/api/events/${eventId}/attendance/${memberId}`, {
    data: { status: 'Present' },
    headers: { Cookie: cookie },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('Present');
  expect(body.memberId).toBe(memberId);
  expect(body.eventId).toBe(eventId);
});

test('PUT /api/events/{id}/attendance/{memberId} with invalid status returns 400', async ({ request }) => {
  const cookie = await getAdminCookieHeader(request);
  const eventId = await createProjectAndEvent(request, cookie);
  const membersRes = await request.get(`${API_BASE}/api/members`, { headers: { Cookie: cookie } });
  const members = await membersRes.json();
  const memberId = members[0].id;

  const res = await request.put(`${API_BASE}/api/events/${eventId}/attendance/${memberId}`, {
    data: { status: 'INVALID' },
    headers: { Cookie: cookie },
  });
  expect(res.status()).toBe(400);
});

test('POST /api/checkin/{eventId} with member session returns 200', async ({ request }) => {
  const adminCookie = await getAdminCookieHeader(request);
  const eventId = await createProjectAndEvent(request, adminCookie);
  const memberCookie = await getMemberCookieHeader(request);

  const res = await request.post(`${API_BASE}/api/checkin/${eventId}`, {
    headers: { Cookie: memberCookie },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('Present');
});

test('PUT /api/events/{id}/attendance/me/excused with member session returns 200', async ({ request }) => {
  const adminCookie = await getAdminCookieHeader(request);
  const eventId = await createProjectAndEvent(request, adminCookie);
  const memberCookie = await getMemberCookieHeader(request);

  const res = await request.put(`${API_BASE}/api/events/${eventId}/attendance/me/excused`, {
    headers: { Cookie: memberCookie },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('Excused');
});

test('toggle excused twice returns Absent then Excused', async ({ request }) => {
  const adminCookie = await getAdminCookieHeader(request);
  const eventId = await createProjectAndEvent(request, adminCookie);
  const memberCookie = await getMemberCookieHeader(request);

  // First toggle: no record → Excused
  const res1 = await request.put(`${API_BASE}/api/events/${eventId}/attendance/me/excused`, {
    headers: { Cookie: memberCookie },
  });
  expect((await res1.json()).status).toBe('Excused');

  // Second toggle: Excused → Absent
  const res2 = await request.put(`${API_BASE}/api/events/${eventId}/attendance/me/excused`, {
    headers: { Cookie: memberCookie },
  });
  expect((await res2.json()).status).toBe('Absent');

  // Third toggle: Absent → Excused
  const res3 = await request.put(`${API_BASE}/api/events/${eventId}/attendance/me/excused`, {
    headers: { Cookie: memberCookie },
  });
  expect((await res3.json()).status).toBe('Excused');
});

test('PUT attendance updates existing record (idempotent update)', async ({ request }) => {
  const cookie = await getAdminCookieHeader(request);
  const eventId = await createProjectAndEvent(request, cookie);
  const membersRes = await request.get(`${API_BASE}/api/members`, { headers: { Cookie: cookie } });
  const members = await membersRes.json();
  const memberId = members[0].id;

  // Set to Present
  await request.put(`${API_BASE}/api/events/${eventId}/attendance/${memberId}`, {
    data: { status: 'Present' },
    headers: { Cookie: cookie },
  });

  // Update to Absent
  const res = await request.put(`${API_BASE}/api/events/${eventId}/attendance/${memberId}`, {
    data: { status: 'Absent' },
    headers: { Cookie: cookie },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe('Absent');
});
