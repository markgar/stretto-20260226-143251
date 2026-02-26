import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, setAuthUser } from '../mocks/testUtils';

import EventFormPage from './EventFormPage';

function renderNewEventForm(queryClient = createQueryClient(), projectId = 'p1') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/events/new?projectId=${projectId}`]}>
        <Routes>
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:id" element={<div data-testid="event-detail">Event Detail</div>} />
          <Route path="/projects/:id" element={<div data-testid="project-detail">Project Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderEditEventForm(queryClient = createQueryClient(), id: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/events/${id}/edit`]}>
        <Routes>
          <Route path="/events/:id/edit" element={<EventFormPage />} />
          <Route path="/events/:id" element={<div data-testid="event-detail">Event Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setAuthUser(null));
afterEach(() => setAuthUser(null));

test('renders "Add Event" heading when creating a new event', () => {
  const qc = createQueryClient();
  qc.setQueryData(['venues'], []);
  renderNewEventForm(qc);
  expect(screen.getByRole('heading', { name: 'Add Event' })).toBeInTheDocument();
});

test('renders "Edit Event" heading when editing an existing event', () => {
  const qc = createQueryClient();
  qc.setQueryData(['event', 'e1'], { id: 'e1', type: 0, date: '2025-10-15', startTime: '18:30:00', durationMinutes: 120 });
  qc.setQueryData(['venues'], []);
  renderEditEventForm(qc, 'e1');
  expect(screen.getByRole('heading', { name: 'Edit Event' })).toBeInTheDocument();
});

test('renders type select, date, start time, duration, venue select inputs', () => {
  const qc = createQueryClient();
  qc.setQueryData(['venues'], []);
  renderNewEventForm(qc);
  expect(screen.getByTestId('type-select')).toBeInTheDocument();
  expect(screen.getByTestId('date-input')).toBeInTheDocument();
  expect(screen.getByTestId('start-time-input')).toBeInTheDocument();
  expect(screen.getByTestId('duration-input')).toBeInTheDocument();
  expect(screen.getByTestId('venue-select')).toBeInTheDocument();
});

test('type select contains Rehearsal and Performance options', () => {
  const qc = createQueryClient();
  qc.setQueryData(['venues'], []);
  renderNewEventForm(qc);
  const select = screen.getByTestId('type-select');
  expect(select).toContainHTML('Rehearsal');
  expect(select).toContainHTML('Performance');
});

test('venue select is populated with available venues', () => {
  const qc = createQueryClient();
  qc.setQueryData(['venues'], [{ id: 'v1', name: 'City Hall' }, { id: 'v2', name: 'Grand Theatre' }]);
  renderNewEventForm(qc);
  expect(screen.getByText('City Hall')).toBeInTheDocument();
  expect(screen.getByText('Grand Theatre')).toBeInTheDocument();
});

test('shows start time validation error when start time is missing', async () => {
  const qc = createQueryClient();
  qc.setQueryData(['venues'], []);
  const { getByTestId } = renderNewEventForm(qc);
  await userEvent.type(getByTestId('duration-input'), '120');
  await userEvent.click(getByTestId('submit-button'));
  await waitFor(() => {
    expect(screen.getByText('Start time is required')).toBeInTheDocument();
  });
});

