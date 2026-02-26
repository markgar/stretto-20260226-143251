import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, setAuthUser } from '../mocks/testUtils';

import ProjectEventsTab from '../components/ProjectEventsTab';

function renderTab(queryClient = createQueryClient(), projectId = 'p1') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectEventsTab projectId={projectId} />} />
          <Route path="/events/:id" element={<div data-testid="event-detail">Event Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setAuthUser(null));
afterEach(() => setAuthUser(null));

test('shows empty state message when no events exist', () => {
  const qc = createQueryClient();
  qc.setQueryData(['events', 'p1'], []);
  renderTab(qc);
  expect(screen.getByText(/No events scheduled yet/i)).toBeInTheDocument();
});

test('shows skeleton loader while events are loading', () => {
  renderTab();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('renders Rehearsal badge for event with type 0', () => {
  const qc = createQueryClient();
  qc.setQueryData(['events', 'p1'], [
    { id: 'e1', date: '2025-10-15', startTime: '18:30', type: 0, durationMinutes: 120, venueName: undefined },
  ]);
  renderTab(qc);
  expect(screen.getByText('Rehearsal')).toBeInTheDocument();
});

test('renders Performance badge for event with type 1', () => {
  const qc = createQueryClient();
  qc.setQueryData(['events', 'p1'], [
    { id: 'e1', date: '2025-10-20', startTime: '19:00', type: 1, durationMinutes: 90, venueName: 'City Hall' },
  ]);
  renderTab(qc);
  expect(screen.getByText('Performance')).toBeInTheDocument();
});

test('renders venue name when assigned, dash when not', () => {
  const qc = createQueryClient();
  qc.setQueryData(['events', 'p1'], [
    { id: 'e1', date: '2025-10-15', startTime: '18:30', type: 0, durationMinutes: 120, venueName: 'Grand Hall' },
    { id: 'e2', date: '2025-10-22', startTime: '19:00', type: 1, durationMinutes: 90, venueName: undefined },
  ]);
  renderTab(qc);
  expect(screen.getByText('Grand Hall')).toBeInTheDocument();
  expect(screen.getByText('—')).toBeInTheDocument();
});

test('each event row is linked to the event detail page', () => {
  const qc = createQueryClient();
  qc.setQueryData(['events', 'p1'], [
    { id: 'e1', date: '2025-10-15', startTime: '18:30', type: 0, durationMinutes: 120 },
  ]);
  renderTab(qc);
  const links = screen.getAllByRole('link');
  const eventLink = links.find((l) => l.getAttribute('href') === '/events/e1');
  expect(eventLink).toBeDefined();
});

