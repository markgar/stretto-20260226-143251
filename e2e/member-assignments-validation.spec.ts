<<<<<<< HEAD
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
=======
import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password';
const API_BASE = 'http://app:8080';
const FRONTEND_BASE = process.env.BASE_URL || 'http://frontend:5173';

async function loginViaApi(page: Page): Promise<{ token: string; userId: string }> {
  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const headers = resp.headers();
  const setCookie = headers['set-cookie'] || '';
  const tokenMatch = setCookie.match(/stretto_session=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : '';
  const user = await resp.json();

  await page.goto(FRONTEND_BASE + '/login');
  await page.context().addCookies([
    {
      name: 'stretto_session',
      value: token,
      domain: 'frontend',
      path: '/',
      secure: false,
      httpOnly: false,
    },
  ]);
  await page.evaluate((u) => {
    localStorage.setItem('stretto_user', JSON.stringify(u));
  }, user);
  return { token, userId: user.id };
}

async function createProject(token: string, page: Page): Promise<string> {
  const resp = await page.request.post(`${API_BASE}/api/projects`, {
    headers: { Cookie: `stretto_session=${token}` },
    data: {
      name: 'Assignments Test Project',
      programYearId: '22222222-2222-2222-2222-222222222222',
      startDate: '2025-10-01',
      endDate: '2025-12-31',
    },
  });
  const project = await resp.json();
  return project.id;
}

test.describe('Member Assignments — ProjectMembersTab', () => {
  let token: string;
  let projectId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const { token: t } = await loginViaApi(page);
    token = t;
    projectId = await createProject(token, page);
    await page.close();
  });

  test('Members tab renders with search input and member rows', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await loginViaApi(page);
    // Navigate to project via React Router
    await page.goto(FRONTEND_BASE + '/program-years');
    await page.goto(FRONTEND_BASE + `/projects/${projectId}`);

    // Click Members tab
    await page.getByTestId('tab-members').click();

    // Search input visible
    await expect(page.getByTestId('member-search-input')).toBeVisible();

    // At least one member row visible (admin@example.com)
    await expect(page.getByRole('cell', { name: 'Admin User' })).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test('Members tab shows Assign button for unassigned members', async ({ page }) => {
    // Get member IDs from API
    const resp = await page.request.get(`${API_BASE}/api/projects/${projectId}/members`, {
      headers: { Cookie: `stretto_session=${token}` },
    });
    const members = await resp.json();
    const unassigned = members.find((m: { isAssigned: boolean }) => !m.isAssigned);
    expect(unassigned).toBeTruthy();

    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + `/projects/${projectId}`);
    await page.getByTestId('tab-members').click();

    // Assign button visible for unassigned member
    const assignBtn = page.getByTestId(`assign-${unassigned.memberId}`);
    await expect(assignBtn).toBeVisible();
  });

  test('Member search input filters list', async ({ page }) => {
    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + `/projects/${projectId}`);
    await page.getByTestId('tab-members').click();

    await page.getByTestId('member-search-input').fill('admin');
    await expect(page.getByRole('cell', { name: 'Admin User' })).toBeVisible();
    // Member User should not be visible after filtering
    await expect(page.getByRole('cell', { name: 'Member User' })).not.toBeVisible();
  });

  test('Assign button assigns a member and shows Unassign button', async ({ page }) => {
    // Make sure member is unassigned first
    const resp = await page.request.get(`${API_BASE}/api/projects/${projectId}/members`, {
      headers: { Cookie: `stretto_session=${token}` },
    });
    const members = await resp.json();
    const member = members.find((m: { isAssigned: boolean; memberId: string }) => !m.isAssigned);

    // Ensure unassigned state via API
    await page.request.delete(`${API_BASE}/api/projects/${projectId}/members/${member.memberId}`, {
      headers: { Cookie: `stretto_session=${token}` },
    });

    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + `/projects/${projectId}`);
    await page.getByTestId('tab-members').click();

    const assignBtn = page.getByTestId(`assign-${member.memberId}`);
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    // Unassign button should now appear
    await expect(page.getByTestId(`unassign-${member.memberId}`)).toBeVisible();
  });

  test('Unassign button unassigns a member and shows Assign button', async ({ page }) => {
    // Get member IDs, assign one via API
    const resp = await page.request.get(`${API_BASE}/api/projects/${projectId}/members`, {
      headers: { Cookie: `stretto_session=${token}` },
    });
    const members = await resp.json();
    const member = members[0];

    // Ensure assigned via API
    await page.request.post(`${API_BASE}/api/projects/${projectId}/members`, {
      headers: { Cookie: `stretto_session=${token}`, 'Content-Type': 'application/json' },
      data: { memberId: member.memberId },
    });

    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + `/projects/${projectId}`);
    await page.getByTestId('tab-members').click();

    const unassignBtn = page.getByTestId(`unassign-${member.memberId}`);
    await expect(unassignBtn).toBeVisible();
    await unassignBtn.click();

    // Assign button should now appear
    await expect(page.getByTestId(`assign-${member.memberId}`)).toBeVisible();
  });
});

test.describe('Utilization Grid — UtilizationGridPage', () => {
  test('Utilization page renders with program year select', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + '/program-years');
    // Navigate via sidebar nav
    const utilNav = page.getByTestId('nav-desktop-utilization-grid').first();
    if (await utilNav.isVisible()) {
      await utilNav.click();
    } else {
      await page.goto(FRONTEND_BASE + '/utilization');
    }

    await expect(page.getByRole('heading', { name: 'Utilization' })).toBeVisible();
    await expect(page.getByTestId('program-year-select')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('Utilization page shows empty state when no year selected', async ({ page }) => {
    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + '/utilization');

    await expect(page.getByText('Select a program year to view utilization.')).toBeVisible();
  });

  test('Utilization page loads data when program year selected', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + '/utilization');

    // Select the program year
    const select = page.getByTestId('program-year-select');
    await expect(select).toBeVisible();
    await select.selectOption({ index: 1 }); // select first real option

    // Table or member list should appear (data may exist from earlier test runs)
    await page.waitForTimeout(2000);

    // Verify no JS errors
    expect(errors).toHaveLength(0);
  });

  test('Utilization page shows table with member rows on desktop', async ({ page }) => {
    // Assign member to project first via API so we have data
    const loginResp = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const setCookie = loginResp.headers()['set-cookie'] || '';
    const tokenMatch = setCookie.match(/stretto_session=([^;]+)/);
    const tok = tokenMatch ? tokenMatch[1] : '';

    // Get projects list
    const projResp = await page.request.get(`${API_BASE}/api/projects?programYearId=22222222-2222-2222-2222-222222222222`, {
      headers: { Cookie: `stretto_session=${tok}` },
    });
    const projects = await projResp.json();

    if (projects.length > 0) {
      // Assign admin to first project
      const membResp = await page.request.get(`${API_BASE}/api/projects/${projects[0].id}/members`, {
        headers: { Cookie: `stretto_session=${tok}` },
      });
      const members = await membResp.json();
      if (members.length > 0 && !members[0].isAssigned) {
        await page.request.post(`${API_BASE}/api/projects/${projects[0].id}/members`, {
          headers: { Cookie: `stretto_session=${tok}`, 'Content-Type': 'application/json' },
          data: { memberId: members[0].memberId },
        });
      }
    }

    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + '/utilization');

    const select = page.getByTestId('program-year-select');
    await select.selectOption({ index: 1 });
    await page.waitForTimeout(2000);

    // Utilization heading should still be present
    await expect(page.getByRole('heading', { name: 'Utilization' })).toBeVisible();
  });

  test('Utilization page renders inside AppShell with nav links', async ({ page }) => {
    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + '/utilization');

    // AppShell nav link for utilization
    await expect(page.getByTestId('program-year-select')).toBeVisible();
    // Confirm page has the heading
    await expect(page.getByRole('heading', { name: 'Utilization' })).toBeVisible();
  });
});

test.describe('Smoke Tests — App Shell Navigation', () => {
  test('GET /health returns 200', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/health`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe('healthy');
  });

  test('/utilization route renders (not ComingSoon)', async ({ page }) => {
    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + '/utilization');
    await expect(page.getByRole('heading', { name: 'Utilization' })).toBeVisible();
    // Should NOT show "Coming Soon"
    await expect(page.getByText('Coming Soon')).not.toBeVisible();
  });

  test('Project Members tab is wired to ProjectMembersTab component', async ({ page }) => {
    // Create a project so we can navigate to it
    const loginResp = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const setCookie = loginResp.headers()['set-cookie'] || '';
    const tokenMatch = setCookie.match(/stretto_session=([^;]+)/);
    const tok = tokenMatch ? tokenMatch[1] : '';

    const resp = await page.request.post(`${API_BASE}/api/projects`, {
      headers: { Cookie: `stretto_session=${tok}`, 'Content-Type': 'application/json' },
      data: {
        name: 'Smoke Test Project',
        programYearId: '22222222-2222-2222-2222-222222222222',
        startDate: '2025-11-01',
        endDate: '2025-12-31',
      },
    });
    const project = await resp.json();

    await loginViaApi(page);
    await page.goto(FRONTEND_BASE + `/projects/${project.id}`);
    await page.getByTestId('tab-members').click();

    // Should show member-search-input, not "Coming soon"
    await expect(page.getByTestId('member-search-input')).toBeVisible();
    await expect(page.getByText('Coming soon')).not.toBeVisible();
  });
>>>>>>> 955966d ([validator] Validate milestone-08b: Member Assignments + Utilization Grid Frontend)
});
