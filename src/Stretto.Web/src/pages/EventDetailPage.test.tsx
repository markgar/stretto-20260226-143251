import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, setAuthUser } from '../mocks/testUtils';

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

function renderPage(queryClient = createQueryClient(), id = 'e1') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/events/${id}`]}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<div data-testid="event-form">Edit Form</div>} />
          <Route path="/projects/:id" element={<div data-testid="project-detail">Project Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setAuthUser(null));
afterEach(() => setAuthUser(null));

test('renders event type badge as Rehearsal for type 0', () => {
  const qc = createQueryClient();
  qc.setQueryData(['event', 'e1'], sampleEvent);
  renderPage(qc);
  expect(screen.getByText('Rehearsal')).toBeInTheDocument();
});

test('renders event type badge as Performance for type 1', () => {
  const qc = createQueryClient();
  qc.setQueryData(['event', 'e1'], { ...sampleEvent, type: 1 });
  renderPage(qc);
  expect(screen.getByText('Performance')).toBeInTheDocument();
});

test('renders event details — venue name, duration, start time', () => {
  const qc = createQueryClient();
  qc.setQueryData(['event', 'e1'], sampleEvent);
  renderPage(qc);
  expect(screen.getByText('City Hall')).toBeInTheDocument();
  expect(screen.getByText('120 min')).toBeInTheDocument();
  expect(screen.getByText('18:30')).toBeInTheDocument();
});

test('shows "No venue" when venue is not assigned', () => {
  const qc = createQueryClient();
  qc.setQueryData(['event', 'e1'], { ...sampleEvent, venueName: undefined });
  renderPage(qc);
  expect(screen.getByText('No venue')).toBeInTheDocument();
});

test('shows skeleton loader while event is loading', () => {
  renderPage();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('shows inline error when event fetch fails', async () => {
  server.use(http.get('/api/events/:id', () => HttpResponse.error()));
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Failed to load event/i)).toBeInTheDocument();
  });
});

test('renders link back to parent project', () => {
  const qc = createQueryClient();
  qc.setQueryData(['event', 'e1'], sampleEvent);
  renderPage(qc);
  const projectLink = screen.getByRole('link', { name: 'View project' });
  expect(projectLink).toHaveAttribute('href', '/projects/p1');
});

