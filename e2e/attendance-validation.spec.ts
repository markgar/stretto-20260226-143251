<<<<<<< HEAD
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
=======
import { test, expect, Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('admin@example.com');
  const submitBtn = page.getByTestId('login-submit').or(page.getByRole('button', { name: /sign in|log in|submit/i })).first();
  await submitBtn.click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

// Get a session cookie by logging in directly via the API (bypasses Secure cookie constraint)
async function getApiSession(request: any): Promise<string | null> {
  const res = await request.post('http://app:8080/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ email: 'admin@example.com' })
  });
  if (res.status() !== 200) return null;
  const setCookie = res.headers()['set-cookie'];
  if (!setCookie) return null;
  const match = setCookie.match(/stretto_session=([^;]+)/);
  return match ? match[1] : null;
}

test('GET /health returns healthy', async ({ request }) => {
  const res = await request.get('http://app:8080/health');
>>>>>>> 64ed92f ([validator] Fix tuple deconstruction in audition controllers; add attendance Playwright tests)
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('healthy');
});

<<<<<<< HEAD
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
=======
test('CheckIn page renders checkin-button without AppShell', async ({ page }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  await loginAsAdmin(page);
  
  // Navigate to a fake eventId checkin page (it will show the button regardless of backend)
  const fakeEventId = '00000000-0000-0000-0000-000000000001';
  
  // Use client-side navigation to avoid cookie issues on reload
  await page.evaluate((id) => {
    window.history.pushState({}, '', `/checkin/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, fakeEventId);
  
  await page.waitForLoadState('networkidle');
  
  // Check that checkin-button is visible
  const checkinBtn = page.getByTestId('checkin-button');
  await expect(checkinBtn).toBeVisible({ timeout: 10000 });
  
  // Verify NO AppShell nav (sidebar) is present
  const sidebarNav = page.getByTestId('nav-desktop-dashboard');
  await expect(sidebarNav).not.toBeVisible();
  
  expect(jsErrors).toHaveLength(0);
});

test('CheckIn page shows I\'m here button text', async ({ page }) => {
  await loginAsAdmin(page);
  
  const fakeEventId = '00000000-0000-0000-0000-000000000001';
  await page.evaluate((id) => {
    window.history.pushState({}, '', `/checkin/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, fakeEventId);
  
  await page.waitForLoadState('networkidle');
  
  const checkinBtn = page.getByTestId('checkin-button');
  await expect(checkinBtn).toBeVisible({ timeout: 10000 });
  await expect(checkinBtn).toContainText("I'm here");
});

test('EventDetailPage renders attendance-panel for admin', async ({ page, request }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  // Get session via direct API call
  const sessionToken = await getApiSession(request);
  expect(sessionToken).not.toBeNull();
  const cookieHeader = `stretto_session=${sessionToken}`;

  // Get program years
  const pyRes = await request.get('http://app:8080/api/program-years', { headers: { Cookie: cookieHeader } });
  expect(pyRes.status()).toBe(200);
  const programYears = await pyRes.json();
  const pyId = programYears[0].id;

  // Create project
  const projRes = await request.post('http://app:8080/api/projects', {
    headers: { Cookie: cookieHeader, 'Content-Type': 'application/json' },
    data: JSON.stringify({ programYearId: pyId, name: 'Test Attendance Project', description: 'For attendance testing', startDate: '2025-09-01', endDate: '2026-06-30' })
  });
  expect(projRes.status()).toBe(201);
  const project = await projRes.json();

  // Create event
  const eventRes = await request.post('http://app:8080/api/events', {
    headers: { Cookie: cookieHeader, 'Content-Type': 'application/json' },
    data: JSON.stringify({ projectId: project.id, type: 0, date: '2025-10-15', startTime: '19:00', durationMinutes: 120 })
  });
  expect(eventRes.status()).toBe(201);
  const event = await eventRes.json();
  const eventId = event.id;

  // Login in browser context
  await loginAsAdmin(page);

  // Mock the event API call to ensure it loads without depending on cookie forwarding
  await page.route(`**/api/events/${eventId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: eventId,
        projectId: project.id,
        type: 0,
        date: '2025-10-15',
        startTime: '19:00:00',
        durationMinutes: 120,
        venueId: null,
        venueName: null
      })
    });
  });

  // Mock the attendance API call
  await page.route(`**/api/events/${eventId}/attendance`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  // Navigate to the event detail page via client-side nav
  await page.evaluate((id) => {
    window.history.pushState({}, '', `/events/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, eventId);

  await page.waitForLoadState('networkidle');

  // Check attendance panel is visible
  const attendancePanel = page.getByTestId('attendance-panel');
  await expect(attendancePanel).toBeVisible({ timeout: 15000 });

  expect(jsErrors.filter(e => !e.includes('Failed to fetch'))).toHaveLength(0);
});

test('EventDetailPage shows checkin-url in attendance panel', async ({ page, request }) => {
  const sessionToken = await getApiSession(request);
  expect(sessionToken).not.toBeNull();
  const cookieHeader = `stretto_session=${sessionToken}`;

  const pyRes = await request.get('http://app:8080/api/program-years', { headers: { Cookie: cookieHeader } });
  const programYears = await pyRes.json();
  const pyId = programYears[0].id;

  const projRes = await request.post('http://app:8080/api/projects', {
    headers: { Cookie: cookieHeader, 'Content-Type': 'application/json' },
    data: JSON.stringify({ programYearId: pyId, name: 'Checkin URL Test', description: 'test', startDate: '2025-09-01', endDate: '2026-06-30' })
  });
  const project = await projRes.json();

  const eventRes = await request.post('http://app:8080/api/events', {
    headers: { Cookie: cookieHeader, 'Content-Type': 'application/json' },
    data: JSON.stringify({ projectId: project.id, type: 0, date: '2025-11-01', startTime: '18:00', durationMinutes: 60 })
  });
  const event = await eventRes.json();

  await loginAsAdmin(page);

  // Mock the event and attendance API calls
  await page.route(`**/api/events/${event.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: event.id, projectId: project.id, type: 0, date: '2025-11-01', startTime: '18:00:00', durationMinutes: 60, venueId: null, venueName: null })
    });
  });
  await page.route(`**/api/events/${event.id}/attendance`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.evaluate((id) => {
    window.history.pushState({}, '', `/events/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, event.id);

  await page.waitForLoadState('networkidle');

  const checkinUrl = page.getByTestId('checkin-url');
  await expect(checkinUrl).toBeVisible({ timeout: 15000 });
  await expect(checkinUrl).toContainText(`/checkin/${event.id}`);
});

test('attendance API GET /api/events/{id}/attendance requires auth', async ({ request }) => {
  const fakeId = '00000000-0000-0000-0000-000000000001';
  const res = await request.get(`http://app:8080/api/events/${fakeId}/attendance`);
  expect(res.status()).toBe(401);
});

test('attendance API PUT /api/events/{id}/attendance/{memberId} requires auth', async ({ request }) => {
  const fakeId = '00000000-0000-0000-0000-000000000001';
  const res = await request.put(`http://app:8080/api/events/${fakeId}/attendance/${fakeId}`, {
    data: { status: 'Present' }
  });
  expect(res.status()).toBe(401);
});

>>>>>>> 64ed92f ([validator] Fix tuple deconstruction in audition controllers; add attendance Playwright tests)
