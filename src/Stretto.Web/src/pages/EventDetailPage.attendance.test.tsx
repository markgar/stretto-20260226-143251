import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, setAuthUser, adminUser, memberUser } from '../mocks/testUtils';

import EventDetailPage from './EventDetailPage';

const sampleEvent = {
  id: 'e1',
  type: 0,
  date: '2025-10-15',
  startTime: '18:30',
  durationMinutes: 120,
  venueName: 'City Hall',
  projectId: 'p1',
};

const sampleAttendance = [
  { memberId: 'm1', memberName: 'Alice Alto', status: 'Present' },
  { memberId: 'm2', memberName: 'Bob Bass', status: 'Absent' },
  { memberId: 'm3', memberName: 'Carol Cello', status: null },
];

function renderPage(id = 'e1') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[`/events/${id}`]}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setAuthUser(null));
afterEach(() => setAuthUser(null));

test('admin user sees attendance-panel', async () => {
  setAuthUser(adminUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json(sampleAttendance)),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'admin-1', memberName: 'Admin User', status: null })),
  );
  renderPage();
  await waitFor(() => {
    expect(screen.getByTestId('attendance-panel')).toBeInTheDocument();
  });
});

test('admin user sees checkin-url containing event id', async () => {
  setAuthUser(adminUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json([])),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'admin-1', memberName: 'Admin User', status: null })),
  );
  renderPage('e1');
  await waitFor(() => {
    expect(screen.getByTestId('checkin-url')).toHaveTextContent('/checkin/e1');
  });
});

test('non-admin user does not see attendance-panel', async () => {
  setAuthUser(memberUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json([])),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'member-1', memberName: 'Alice Member', status: null })),
  );
  renderPage();
  await waitFor(() => {
    expect(screen.queryByText('City Hall')).toBeInTheDocument();
  });
  expect(screen.queryByTestId('attendance-panel')).not.toBeInTheDocument();
});

test('admin attendance panel shows member names from attendance list', async () => {
  setAuthUser(adminUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json(sampleAttendance)),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'admin-1', memberName: 'Admin User', status: null })),
  );
  renderPage();
  await waitFor(() => {
    expect(screen.getByText('Alice Alto')).toBeInTheDocument();
  });
  expect(screen.getByText('Bob Bass')).toBeInTheDocument();
});

test('attendance panel shows Present status badge in green', async () => {
  setAuthUser(adminUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json([
      { memberId: 'm1', memberName: 'Alice Alto', status: 'Present' },
    ])),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'admin-1', memberName: 'Admin User', status: null })),
  );
  renderPage();
  await waitFor(() => {
    const badge = screen.getByText('Present', { selector: 'span' });
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/green/);
  });
});

test('attendance panel shows Excused status badge in amber', async () => {
  setAuthUser(adminUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json([
      { memberId: 'm1', memberName: 'Alice Alto', status: 'Excused' },
    ])),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'admin-1', memberName: 'Admin User', status: null })),
  );
  renderPage();
  await waitFor(() => {
    const badge = screen.getByText('Excused', { selector: 'span' });
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/amber/);
  });
});

test('member user sees excuse-toggle button', async () => {
  setAuthUser(memberUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json([])),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'member-1', memberName: 'Alice Member', status: null })),
  );
  renderPage();
  await waitFor(() => {
    expect(screen.getByTestId('excuse-toggle')).toBeInTheDocument();
  });
});

test('excuse-toggle shows "Excuse my absence" when member is not excused', async () => {
  setAuthUser(memberUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json([])),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'member-1', memberName: 'Alice Member', status: 'Present' })),
  );
  renderPage();
  await waitFor(() => {
    expect(screen.getByTestId('excuse-toggle')).toHaveTextContent('Excuse my absence');
  });
});

test('excuse-toggle shows "Remove excuse" when member is currently excused', async () => {
  setAuthUser(memberUser);
  server.use(
    http.get('/api/events/:id', () => HttpResponse.json(sampleEvent)),
    http.get('/api/events/:eventId/attendance', () => HttpResponse.json([])),
    http.get('/api/events/:eventId/attendance/me', () => HttpResponse.json({ memberId: 'member-1', memberName: 'Alice Member', status: 'Excused' })),
  );
  renderPage();
  await waitFor(() => {
    expect(screen.getByTestId('excuse-toggle')).toHaveTextContent('Remove excuse');
  });
});
