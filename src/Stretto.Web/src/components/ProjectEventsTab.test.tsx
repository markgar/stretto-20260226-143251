import { vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('zustand', () => ({
  create: (fn: (set: (state: object) => void) => object) => {
    let state = fn((partial: object) => {
      Object.assign(state, typeof partial === 'function' ? (partial as (s: object) => object)(state) : partial);
    });
    const useStore = (selector?: (s: object) => unknown) =>
      selector ? selector(state) : state;
    useStore.getState = () => state;
    return useStore;
  },
}));

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

import ProjectEventsTab from '../components/ProjectEventsTab';

function renderTab(projectId = 'p1') {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectEventsTab projectId={projectId} />} />
        <Route path="/events/:id" element={<div data-testid="event-detail">Event Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: [], isLoading: false });
});

test('shows empty state message when no events exist', () => {
  renderTab();
  expect(screen.getByText(/No events scheduled yet/i)).toBeInTheDocument();
});

test('shows skeleton loader while events are loading', () => {
  mockUseQuery.mockReturnValue({ data: [], isLoading: true });
  renderTab();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('renders Rehearsal badge for event with type 0', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'e1', date: '2025-10-15', startTime: '18:30', type: 0, durationMinutes: 120, venueName: undefined },
    ],
    isLoading: false,
  });
  renderTab();
  expect(screen.getByText('Rehearsal')).toBeInTheDocument();
});

test('renders Performance badge for event with type 1', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'e1', date: '2025-10-20', startTime: '19:00', type: 1, durationMinutes: 90, venueName: 'City Hall' },
    ],
    isLoading: false,
  });
  renderTab();
  expect(screen.getByText('Performance')).toBeInTheDocument();
});

test('renders venue name when assigned, dash when not', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'e1', date: '2025-10-15', startTime: '18:30', type: 0, durationMinutes: 120, venueName: 'Grand Hall' },
      { id: 'e2', date: '2025-10-22', startTime: '19:00', type: 1, durationMinutes: 90, venueName: undefined },
    ],
    isLoading: false,
  });
  renderTab();
  expect(screen.getByText('Grand Hall')).toBeInTheDocument();
  expect(screen.getByText('—')).toBeInTheDocument();
});

test('each event row is linked to the event detail page', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'e1', date: '2025-10-15', startTime: '18:30', type: 0, durationMinutes: 120 },
    ],
    isLoading: false,
  });
  renderTab();
  const links = screen.getAllByRole('link');
  const eventLink = links.find((l) => l.getAttribute('href') === '/events/e1');
  expect(eventLink).toBeDefined();
});
