import { vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

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

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseQueryClient = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

import ProgramYearsListPage from './ProgramYearsListPage';

const mockQueryClient = { invalidateQueries: vi.fn() };

function renderPage() {
  return render(
    <MemoryRouter>
      <ProgramYearsListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: [] });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseQueryClient.mockReturnValue(mockQueryClient);
});

test('renders program-years-heading', () => {
  renderPage();
  expect(screen.getByTestId('program-years-heading')).toBeInTheDocument();
});

test('renders add-program-year-button linking to /program-years/new', () => {
  renderPage();
  const link = screen.getByTestId('add-program-year-button');
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/program-years/new');
});

test('shows program year name and formatted dates', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'py1', name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: false, isArchived: false }],
  });
  renderPage();
  expect(screen.getByText('2025–2026')).toBeInTheDocument();
  expect(screen.getByText(/Sep 1, 2025/)).toBeInTheDocument();
});

test('shows current-badge when isCurrent is true', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'py1', name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: true, isArchived: false }],
  });
  renderPage();
  expect(screen.getByTestId('current-badge-py1')).toBeInTheDocument();
});

test('does not show current-badge when isCurrent is false', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'py1', name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: false, isArchived: false }],
  });
  renderPage();
  expect(screen.queryByTestId('current-badge-py1')).not.toBeInTheDocument();
});

test('shows archive button when not archived and hides when archived', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'py1', name: 'Active Year', startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: false, isArchived: false },
      { id: 'py2', name: 'Archived Year', startDate: '2023-09-01', endDate: '2024-06-30', isCurrent: false, isArchived: true },
    ],
  });
  renderPage();
  expect(screen.getByTestId('archive-py1')).toBeInTheDocument();
  expect(screen.queryByTestId('archive-py2')).not.toBeInTheDocument();
});

test('clicking archive calls mutate with program year id', async () => {
  const mockMutate = vi.fn();
  mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
  mockUseQuery.mockReturnValue({
    data: [{ id: 'py1', name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: false, isArchived: false }],
  });
  renderPage();
  await userEvent.click(screen.getByTestId('archive-py1'));
  expect(mockMutate).toHaveBeenCalledWith('py1');
});

test('shows activate button only when not current and not archived', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'py1', name: 'Draft Year', startDate: '2027-09-01', endDate: '2028-06-30', isCurrent: false, isArchived: false },
      { id: 'py2', name: 'Current Year', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: true, isArchived: false },
      { id: 'py3', name: 'Archived Year', startDate: '2023-09-01', endDate: '2024-06-30', isCurrent: false, isArchived: true },
    ],
  });
  renderPage();
  expect(screen.getByTestId('activate-py1')).toBeInTheDocument();
  expect(screen.queryByTestId('activate-py2')).not.toBeInTheDocument();
  expect(screen.queryByTestId('activate-py3')).not.toBeInTheDocument();
});
