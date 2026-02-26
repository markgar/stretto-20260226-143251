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
});
