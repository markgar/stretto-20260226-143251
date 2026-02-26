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
const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

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

function renderPage(id = 'e1') {
  return render(
    <MemoryRouter initialEntries={[`/events/${id}`]}>
      <Routes>
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/edit" element={<div data-testid="event-form">Edit Form</div>} />
        <Route path="/projects/:id" element={<div data-testid="project-detail">Project Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

test('renders event type badge as Rehearsal for type 0', () => {
  mockUseQuery.mockReturnValue({ data: sampleEvent, isLoading: false, isError: false });
  renderPage();
  expect(screen.getByText('Rehearsal')).toBeInTheDocument();
});

test('renders event type badge as Performance for type 1', () => {
  mockUseQuery.mockReturnValue({ data: { ...sampleEvent, type: 1 }, isLoading: false, isError: false });
  renderPage();
  expect(screen.getByText('Performance')).toBeInTheDocument();
});

test('renders event details — venue name, duration, start time', () => {
  mockUseQuery.mockReturnValue({ data: sampleEvent, isLoading: false, isError: false });
  renderPage();
  expect(screen.getByText('City Hall')).toBeInTheDocument();
  expect(screen.getByText('120 min')).toBeInTheDocument();
  expect(screen.getByText('18:30')).toBeInTheDocument();
});

test('shows "No venue" when venue is not assigned', () => {
  mockUseQuery.mockReturnValue({
    data: { ...sampleEvent, venueName: undefined },
    isLoading: false,
    isError: false,
  });
  renderPage();
  expect(screen.getByText('No venue')).toBeInTheDocument();
});

test('shows skeleton loader while event is loading', () => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
  renderPage();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('shows inline error when event fetch fails', () => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
  renderPage();
  expect(screen.getByText(/Failed to load event/i)).toBeInTheDocument();
});

test('renders link back to parent project', () => {
  mockUseQuery.mockReturnValue({ data: sampleEvent, isLoading: false, isError: false });
  renderPage();
  const projectLink = screen.getByRole('link', { name: 'View project' });
  expect(projectLink).toHaveAttribute('href', '/projects/p1');
});
