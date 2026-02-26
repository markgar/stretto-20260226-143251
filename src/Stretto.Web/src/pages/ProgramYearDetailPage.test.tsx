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
const mockUseQueryClient = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

import ProgramYearDetailPage from './ProgramYearDetailPage';

const mockQueryClient = { invalidateQueries: vi.fn() };

function renderPage(id = 'py1') {
  return render(
    <MemoryRouter initialEntries={[`/program-years/${id}`]}>
      <Routes>
        <Route path="/program-years/:id" element={<ProgramYearDetailPage />} />
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
  mockUseQuery.mockReturnValue({ data: undefined });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseQueryClient.mockReturnValue(mockQueryClient);
});

test('renders name-input', () => {
  renderPage();
  expect(screen.getByTestId('name-input')).toBeInTheDocument();
});

test('renders start-date-input', () => {
  renderPage();
  expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
});

test('renders end-date-input', () => {
  renderPage();
  expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
});

test('renders save-button', () => {
  renderPage();
  expect(screen.getByTestId('save-button')).toBeInTheDocument();
});

test('shows archive-button when program year is not archived', () => {
  mockUseQuery.mockReturnValue({
    data: { id: 'py1', name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: false, isArchived: false },
  });
  renderPage();
  expect(screen.getByTestId('archive-button')).toBeInTheDocument();
});

test('hides archive-button when program year is already archived', () => {
  mockUseQuery.mockReturnValue({
    data: { id: 'py1', name: 'Old Year', startDate: '2022-09-01', endDate: '2023-06-30', isCurrent: false, isArchived: true },
  });
  renderPage();
  expect(screen.queryByTestId('archive-button')).not.toBeInTheDocument();
});

test('shows activate-button when not current and not archived', () => {
  mockUseQuery.mockReturnValue({
    data: { id: 'py1', name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: false, isArchived: false },
  });
  renderPage();
  expect(screen.getByTestId('activate-button')).toBeInTheDocument();
});

test('navigates to /program-years after archive from detail page', async () => {
  mockUseQuery.mockReturnValue({
    data: { id: 'py1', name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: false, isArchived: false },
  });
  const capturedOnSuccess: Array<(() => void) | undefined> = [];
  mockUseMutation.mockImplementation((opts: { onSuccess?: () => void }) => {
    capturedOnSuccess.push(opts.onSuccess);
    return { mutate: vi.fn(), isPending: false };
  });
  renderPage();
  // useProgramYearDetail calls useMutation 3 times: saveMutation (0), archiveMutation (1), activateMutation (2)
  capturedOnSuccess[1]?.();
  await waitFor(() => {
    expect(screen.getByTestId('program-years-list')).toBeInTheDocument();
  });
});
