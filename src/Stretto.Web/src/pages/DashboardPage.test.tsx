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

vi.mock('../api/generated/services/DashboardService', () => ({
  DashboardService: {
    getApiDashboardSummary: vi.fn(),
  },
}));

vi.mock('../api/generated/services/ProgramYearsService', () => ({
  ProgramYearsService: {
    getApiProgramYears: vi.fn(),
  },
}));

import DashboardPage from './DashboardPage';

const sampleProgramYears = [
  { id: 'py1', name: '2024-2025', isCurrent: true },
  { id: 'py2', name: '2023-2024', isCurrent: false },
];

const sampleUpcomingEvents = [
  {
    id: 'evt1',
    projectId: 'proj1',
    projectName: 'Spring Concert',
    eventType: 'Rehearsal',
    date: '2025-03-15',
    startTime: '19:00',
    durationMinutes: 120,
    venueName: 'Main Hall',
  },
  {
    id: 'evt2',
    projectId: 'proj2',
    projectName: 'Fall Showcase',
    eventType: 'Performance',
    date: '2025-03-20',
    startTime: '18:00',
    durationMinutes: 90,
    venueName: null,
  },
];

const sampleRecentActivity = [
  {
    activityType: 'MemberAdded',
    description: 'Alice Smith joined the organization',
    occurredAt: '2025-02-20T10:30:00Z',
  },
  {
    activityType: 'AssignmentCreated',
    description: 'Bob Jones assigned to Spring Concert',
    occurredAt: '2025-02-19T14:15:00Z',
  },
];

const sampleSummary = {
  programYearId: 'py1',
  programYearName: '2024-2025',
  upcomingEvents: sampleUpcomingEvents,
  recentActivity: sampleRecentActivity,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
});

test('renders dashboard heading with data-testid="dashboard-heading"', () => {
  renderPage();
  expect(screen.getByTestId('dashboard-heading')).toBeInTheDocument();
  expect(screen.getByTestId('dashboard-heading')).toHaveTextContent('Dashboard');
});

test('renders program year select with data-testid="program-year-select"', () => {
  renderPage();
  expect(screen.getByTestId('program-year-select')).toBeInTheDocument();
});

test('renders "Current Year" as the default option in program year select', () => {
  renderPage();
  const select = screen.getByTestId('program-year-select');
  expect(select).toHaveDisplayValue('Current Year');
});

test('renders program year options from useProgramYearsList', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByText('2024-2025')).toBeInTheDocument();
  expect(screen.getByText('2023-2024')).toBeInTheDocument();
});

test('shows skeleton loader while dashboard data is loading', () => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
  renderPage();
  expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
});

test('does not show skeleton loader when data has loaded', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: sampleSummary, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
});

test('shows no-upcoming-events empty state when upcomingEvents is empty', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: { ...sampleSummary, upcomingEvents: [] }, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  expect(screen.getByTestId('no-upcoming-events')).toBeInTheDocument();
});

test('shows no-upcoming-events empty state when summary is undefined', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: undefined, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  expect(screen.getByTestId('no-upcoming-events')).toBeInTheDocument();
});

test('renders upcoming-event-row items when events exist', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: sampleSummary, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  const rows = screen.getAllByTestId('upcoming-event-row');
  expect(rows).toHaveLength(2);
});

test('renders project name in upcoming event row', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: sampleSummary, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  expect(screen.getByText('Spring Concert')).toBeInTheDocument();
});

test('renders venue name in upcoming event row', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: sampleSummary, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  expect(screen.getByText('Main Hall')).toBeInTheDocument();
});

test('renders "No venue" for events with null venueName', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: sampleSummary, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  expect(screen.getByText('No venue')).toBeInTheDocument();
});

test('renders event-type-badge for each upcoming event', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: sampleSummary, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  const badges = screen.getAllByTestId('event-type-badge');
  expect(badges).toHaveLength(2);
  expect(badges[0]).toHaveTextContent('Rehearsal');
  expect(badges[1]).toHaveTextContent('Performance');
});

test('shows no-recent-activity empty state when recentActivity is empty', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: { ...sampleSummary, recentActivity: [] }, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  expect(screen.getByTestId('no-recent-activity')).toBeInTheDocument();
});

test('renders activity-item elements when recent activity exists', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: sampleSummary, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  const items = screen.getAllByTestId('activity-item');
  expect(items).toHaveLength(2);
});

test('renders activity item description text', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'dashboard') return { data: sampleSummary, isLoading: false };
    return { data: sampleProgramYears, isLoading: false };
  });
  renderPage();
  expect(screen.getByText('Alice Smith joined the organization')).toBeInTheDocument();
  expect(screen.getByText('Bob Jones assigned to Spring Concert')).toBeInTheDocument();
});

test('changing program year select updates selected value', async () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'programYears') return { data: sampleProgramYears, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  const select = screen.getByTestId('program-year-select');
  await userEvent.selectOptions(select, 'py1');
  expect(select).toHaveValue('py1');
});
