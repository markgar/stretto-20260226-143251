import { vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock zustand (used by AppShell)
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
let mockFormErrors: Record<string, { message: string }> = {};

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    formState: { errors: mockFormErrors, isSubmitting: false },
  }),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => vi.fn()),
}));

const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

import ProgramYearCreatePage from './ProgramYearCreatePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/program-years/new']}>
      <Routes>
        <Route path="/program-years/new" element={<ProgramYearCreatePage />} />
        <Route path="/program-years" element={<div data-testid="program-years-list">Program Years</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFormErrors = {};
  mockHandleSubmit.mockImplementation(
    (fn: (values: Record<string, string>) => void) =>
      (e: Event) => {
        e?.preventDefault?.();
        fn({ name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30' });
      },
  );
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

test('renders name input with data-testid="name-input"', () => {
  renderPage();
  expect(screen.getByTestId('name-input')).toBeInTheDocument();
});

test('renders start-date input with data-testid="start-date-input"', () => {
  renderPage();
  expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
});

test('renders end-date input with data-testid="end-date-input"', () => {
  renderPage();
  expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
});

test('renders submit button with data-testid="submit-button"', () => {
  renderPage();
  expect(screen.getByTestId('submit-button')).toBeInTheDocument();
});

test('shows inline error when name validation fails', () => {
  mockFormErrors = { name: { message: 'Name is required' } };
  renderPage();
  expect(screen.getByText('Name is required')).toBeInTheDocument();
});

test('navigates to /program-years after successful create', async () => {
  let onSuccess: (() => void) | undefined;
  mockUseMutation.mockImplementation((opts: { onSuccess: () => void }) => {
    onSuccess = opts.onSuccess;
    return { mutate: vi.fn(), isPending: false };
  });
  renderPage();
  onSuccess?.();
  await waitFor(() => {
    expect(screen.getByTestId('program-years-list')).toBeInTheDocument();
  });
});
