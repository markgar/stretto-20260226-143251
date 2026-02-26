import { vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

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

vi.mock('../api/generated/services/ProgramYearsService', () => ({
  ProgramYearsService: {
    getApiProgramYears: vi.fn(),
    getApiProgramYearsUtilization: vi.fn(),
  },
}));

import UtilizationGridPage from './UtilizationGridPage';

const sampleProgramYears = [
  { id: 'py1', name: '2024-2025', isCurrent: true },
  { id: 'py2', name: '2023-2024', isCurrent: false },
];

const sampleGrid = {
  projects: [
    { id: 'proj1', name: 'Spring Concert' },
    { id: 'proj2', name: 'Fall Showcase' },
  ],
  members: [
    { memberId: 'm1', fullName: 'Alice Smith', assignedCount: 2, totalProjects: 2, assignedProjectIds: ['proj1', 'proj2'] },
    { memberId: 'm2', fullName: 'Bob Jones', assignedCount: 1, totalProjects: 2, assignedProjectIds: ['proj1'] },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <UtilizationGridPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: [], isLoading: false });
});

test('renders program year select dropdown with data-testid', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByTestId('program-year-select')).toBeInTheDocument();
});

test('renders program year options in dropdown', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByText('2024-2025 (current)')).toBeInTheDocument();
  expect(screen.getByText('2023-2024')).toBeInTheDocument();
});

test('shows empty state prompt before a program year is selected', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByText(/Select a program year to view utilization/i)).toBeInTheDocument();
});

test('shows skeleton loader while data is loading', () => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
  renderPage();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('shows empty state when grid has no members', async () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    if (key === 'utilization') return { data: { projects: [], members: [] }, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  const select = screen.getByTestId('program-year-select');
  await userEvent.selectOptions(select, 'py1');
  expect(screen.getByText(/No utilization data available/i)).toBeInTheDocument();
});

test('renders member names in utilization table when data is loaded', async () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    if (key === 'utilization') return { data: sampleGrid, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  const select = screen.getByTestId('program-year-select');
  await userEvent.selectOptions(select, 'py1');
  expect(screen.getAllByText('Alice Smith').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Bob Jones').length).toBeGreaterThan(0);
});

test('renders utilization fractions in the grid table', async () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    if (key === 'utilization') return { data: sampleGrid, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  const select = screen.getByTestId('program-year-select');
  await userEvent.selectOptions(select, 'py1');
  // Alice: 2/2, Bob: 1/2
  expect(screen.getAllByText('2/2').length).toBeGreaterThan(0);
  expect(screen.getAllByText('1/2').length).toBeGreaterThan(0);
});

test('renders project names as column headers in grid table', async () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    if (key === 'utilization') return { data: sampleGrid, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  const select = screen.getByTestId('program-year-select');
  await userEvent.selectOptions(select, 'py1');
  expect(screen.getAllByText('Spring Concert').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Fall Showcase').length).toBeGreaterThan(0);
});
