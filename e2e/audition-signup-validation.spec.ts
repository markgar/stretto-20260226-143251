<<<<<<< HEAD
import { test, expect, request as playwrightRequest } from '@playwright/test';

// Milestone 12a: Audition Sign-Up — Backend API
// Tests the public audition endpoints (no auth required)

const API_BASE = process.env.API_BASE_URL || 'http://app:8080';

test.describe('Milestone 12a: Audition Sign-Up Backend API', () => {
  let auditionDateId: string;
  let slotId: string;

  test.beforeAll(async () => {
    // Create a new API request context with ignoreHTTPSErrors so Secure cookies work over HTTP
    const apiContext = await playwrightRequest.newContext({ ignoreHTTPSErrors: true });

    // Login as admin to get session cookie
    const loginRes = await apiContext.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@example.com', password: 'password' },
    });
    expect(loginRes.status()).toBe(200);

    // Extract the cookie value manually to use in subsequent requests
    const setCookie = loginRes.headers()['set-cookie'] ?? '';
    const match = setCookie.match(/stretto_session=([^;]+)/);
    const sessionCookie = match ? match[1] : '';

    // Create an audition date (9:00 AM - 11:00 AM, 15-min blocks = 8 slots)
    const createRes = await apiContext.post(`${API_BASE}/api/audition-dates`, {
      data: {
        programYearId: '22222222-2222-2222-2222-222222222222',
        date: '2026-04-11',
        startTime: '09:00:00',
        endTime: '11:00:00',
        blockLengthMinutes: 15,
      },
      headers: sessionCookie ? { Cookie: `stretto_session=${sessionCookie}` } : {},
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    auditionDateId = created.id;
    slotId = created.slots[0].id;

    await apiContext.dispose();
  });

  test('GET /api/public/auditions/{id} returns 200 without auth', async ({ request }) => {
    // Use a fresh request context (no cookies)
    const res = await request.get(`${API_BASE}/api/public/auditions/${auditionDateId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id', auditionDateId);
    expect(body).toHaveProperty('date');
    expect(body).toHaveProperty('startTime');
    expect(body).toHaveProperty('endTime');
    expect(body).toHaveProperty('blockLengthMinutes');
    expect(body).toHaveProperty('slots');
    expect(Array.isArray(body.slots)).toBe(true);
  });

  test('GET /api/public/auditions/{id} slots have isAvailable: true initially', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/auditions/${auditionDateId}`);
    const body = await res.json();
    expect(body.slots.length).toBeGreaterThan(0);
    for (const slot of body.slots) {
      expect(slot).toHaveProperty('id');
      expect(slot).toHaveProperty('slotTime');
      expect(slot.isAvailable).toBe(true);
    }
  });

  test('POST /api/public/auditions/{slotId}/signup returns 200 with slot dto', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/public/auditions/${slotId}/signup`, {
      data: { firstName: 'Jane', lastName: 'Doe', email: 'jane.pw@example.com' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id', slotId);
    expect(body).toHaveProperty('slotTime');
    expect(body).toHaveProperty('status', 'Pending');
    expect(body.memberId).not.toBeNull();
  });

  test('GET /api/public/auditions/{id} shows claimed slot as isAvailable: false', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/auditions/${auditionDateId}`);
    const body = await res.json();
    const claimed = body.slots.find((s: { id: string }) => s.id === slotId);
    expect(claimed).toBeDefined();
    expect(claimed.isAvailable).toBe(false);
    // Other slots still available
    const otherSlots = body.slots.filter((s: { id: string }) => s.id !== slotId);
    expect(otherSlots.every((s: { isAvailable: boolean }) => s.isAvailable === true)).toBe(true);
  });

  test('POST /api/public/auditions/{slotId}/signup duplicate returns 422', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/public/auditions/${slotId}/signup`, {
      data: { firstName: 'Jane', lastName: 'Doe', email: 'jane.pw@example.com' },
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/public/auditions/{id} returns 404 for unknown id', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/auditions/00000000-0000-0000-0000-000000000099`);
    expect(res.status()).toBe(404);
  });
=======
import { test, expect } from '@playwright/test';

// Audition date pre-created via API for testing.
// Created during container startup: date=2026-06-15, 9AM-11AM, 15-min slots.
const AUDITION_DATE_ID = process.env.AUDITION_DATE_ID || '94ae8e13-9220-4d3c-804d-10e0f21f6a6a';

async function getFirstAvailableSlotId(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.get(`http://app:8080/api/public/auditions/${AUDITION_DATE_ID}`);
  const data = await res.json();
  const available = data.slots.find((s: { isAvailable: boolean }) => s.isAvailable);
  return available?.id ?? data.slots[0].id;
}

// Test 1: /auditions/confirmation renders without login
test('confirmation page renders without login (public route)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/auditions/confirmation');

  // Should NOT redirect to /login
  await expect(page).not.toHaveURL(/\/login/);
  // Should show "You're signed up!" heading
  await expect(page.getByText("You're signed up!")).toBeVisible();
  // Should show the note
  await expect(page.getByText('Please arrive a few minutes early')).toBeVisible();
  expect(errors.length).toBe(0);
});

// Test 2: /auditions/confirmation renders with state
test('confirmation page shows date and time when navigated with state', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  // Navigate programmatically with state via React Router
  await page.goto('/login');
  // Navigate using client-side history (no auth needed since it's a public route)
  await page.evaluate(() => {
    window.history.pushState({ slotTime: '09:00', date: '2026-06-15' }, '', '/auditions/confirmation');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { slotTime: '09:00', date: '2026-06-15' } }));
  });
  await page.waitForTimeout(500);

  await expect(page.getByText("You're signed up!")).toBeVisible();
  expect(errors.length).toBe(0);
});

// Test 3: /auditions/:id renders without login (public route)
test('audition sign-up page renders without redirect to login (no auth)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  // Use a fake UUID — page should load and show error (not loading) but NOT redirect to /login
  await page.goto('/auditions/00000000-0000-0000-0000-000000000001');

  // Should NOT redirect to /login
  await expect(page).not.toHaveURL(/\/login/);
  // Page should render something (either loading or error state, not auth redirect)
  // Wait for loading state to resolve
  await page.waitForTimeout(2000);
  await expect(page).not.toHaveURL(/\/login/);
  expect(errors.length).toBe(0);
});

// Test 4: /auditions/:id renders slot grid for a real audition date
test('audition sign-up page renders slot grid for valid audition date', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(`/auditions/${AUDITION_DATE_ID}`);

  // Should NOT redirect to login
  await expect(page).not.toHaveURL(/\/login/);

  // Should show heading
  await expect(page.getByText('Audition Sign-Up')).toBeVisible({ timeout: 10000 });

  // Should show date/time range
  await expect(page.getByText(/June 15, 2026/)).toBeVisible({ timeout: 5000 });

  // Should show slot grid with Available badges
  await expect(page.getByText('Available').first()).toBeVisible({ timeout: 5000 });

  expect(errors.length).toBe(0);
});

// Test 5: Sign-up form appears when slot selected
test('sign-up form appears after clicking Sign Up button', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(`/auditions/${AUDITION_DATE_ID}`);
  await expect(page.getByText('Audition Sign-Up')).toBeVisible({ timeout: 10000 });

  // Click the first "Sign Up" button
  const signUpBtn = page.getByRole('button', { name: 'Sign Up' }).first();
  await expect(signUpBtn).toBeVisible({ timeout: 5000 });
  await signUpBtn.click();

  // Form should appear with fields
  await expect(page.getByTestId('first-name-input')).toBeVisible();
  await expect(page.getByTestId('last-name-input')).toBeVisible();
  await expect(page.getByTestId('email-input')).toBeVisible();
  await expect(page.getByTestId('submit-signup')).toBeVisible();

  expect(errors.length).toBe(0);
});

// Test 6: Sign-up form submits and navigates to confirmation
test('filling and submitting sign-up form navigates to confirmation', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  // Get a fresh available slot
  const slotId = await getFirstAvailableSlotId(request);

  await page.goto(`/auditions/${AUDITION_DATE_ID}`);
  await expect(page.getByText('Audition Sign-Up')).toBeVisible({ timeout: 10000 });

  // Click the Sign Up button for the specific available slot
  const signUpBtn = page.getByTestId(`signup-${slotId}`);
  await signUpBtn.click();

  await page.getByTestId('first-name-input').fill('Test');
  await page.getByTestId('last-name-input').fill('User');
  await page.getByTestId('email-input').fill('test.user.playwright@example.com');
  await page.getByTestId('submit-signup').click();

  // Should navigate to confirmation page
  await expect(page).toHaveURL(/\/auditions\/confirmation/, { timeout: 10000 });
  await expect(page.getByText("You're signed up!")).toBeVisible();

  expect(errors.length).toBe(0);
});

// Test 7: Confirmation page shows "Please arrive a few minutes early"
test('confirmation page shows arrival note', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/auditions/confirmation');
  await expect(page.getByText(/Please arrive a few minutes early/)).toBeVisible();
  expect(errors.length).toBe(0);
});

// Test 8: J-1 Smoke - GET /health returns 200
test('[J-1] GET /health returns 200', async ({ page }) => {
  const response = await page.request.get('http://app:8080/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('healthy');
>>>>>>> e47852d ([validator] Fix Vite proxy, add audition sign-up UI tests, update DEPLOY.md)
});
