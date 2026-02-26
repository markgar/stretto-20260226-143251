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

const mockHandleSubmit = vi.fn();
const mockRegister = vi.fn(() => ({ name: 'field', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }));
const mockReset = vi.fn();
let mockFormErrors: Record<string, { message: string }> = {};

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    reset: mockReset,
    formState: { errors: mockFormErrors, isSubmitting: false },
  }),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => vi.fn()),
}));

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

import EventFormPage from './EventFormPage';

function renderNewEventForm(projectId = 'p1') {
  return render(
    <MemoryRouter initialEntries={[`/events/new?projectId=${projectId}`]}>
      <Routes>
        <Route path="/events/new" element={<EventFormPage />} />
        <Route path="/events/:id" element={<div data-testid="event-detail">Event Detail</div>} />
        <Route path="/projects/:id" element={<div data-testid="project-detail">Project Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditEventForm(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/events/${id}/edit`]}>
      <Routes>
        <Route path="/events/:id/edit" element={<EventFormPage />} />
        <Route path="/events/:id" element={<div data-testid="event-detail">Event Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFormErrors = {};
  mockHandleSubmit.mockImplementation((fn: (values: Record<string, unknown>) => void) => (e: Event) => {
    e?.preventDefault?.();
    fn({ type: '0', date: '2025-10-15', startTime: '18:30', durationMinutes: 120 });
  });
  mockUseQuery.mockReturnValue({ data: undefined });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
});

test('renders "Add Event" heading when creating a new event', () => {
  renderNewEventForm();
  expect(screen.getByRole('heading', { name: 'Add Event' })).toBeInTheDocument();
});

test('renders "Edit Event" heading when editing an existing event', () => {
  mockUseQuery
    .mockReturnValueOnce({ data: { id: 'e1', type: 0, date: '2025-10-15', startTime: '18:30', durationMinutes: 120 } })
    .mockReturnValue({ data: [] });
  renderEditEventForm('e1');
  expect(screen.getByRole('heading', { name: 'Edit Event' })).toBeInTheDocument();
});

test('renders type select, date, start time, duration, venue select inputs', () => {
  mockUseQuery.mockReturnValue({ data: [] });
  renderNewEventForm();
  expect(screen.getByTestId('type-select')).toBeInTheDocument();
  expect(screen.getByTestId('date-input')).toBeInTheDocument();
  expect(screen.getByTestId('start-time-input')).toBeInTheDocument();
  expect(screen.getByTestId('duration-input')).toBeInTheDocument();
  expect(screen.getByTestId('venue-select')).toBeInTheDocument();
});

test('type select contains Rehearsal and Performance options', () => {
  mockUseQuery.mockReturnValue({ data: [] });
  renderNewEventForm();
  const select = screen.getByTestId('type-select');
  expect(select).toContainHTML('Rehearsal');
  expect(select).toContainHTML('Performance');
});

test('venue select is populated with available venues', () => {
  mockUseQuery.mockReturnValue({ data: [{ id: 'v1', name: 'City Hall' }, { id: 'v2', name: 'Grand Theatre' }] });
  renderNewEventForm();
  expect(screen.getByText('City Hall')).toBeInTheDocument();
  expect(screen.getByText('Grand Theatre')).toBeInTheDocument();
});

test('shows start time validation error message when format is invalid', () => {
  mockFormErrors = { startTime: { message: 'Use HH:mm format' } };
  mockUseQuery.mockReturnValue({ data: [] });
  renderNewEventForm();
  expect(screen.getByText('Use HH:mm format')).toBeInTheDocument();
});
