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
const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

vi.mock('../api/generated/services/ProgramYearsService', () => ({
  ProgramYearsService: { getApiProgramYears: vi.fn() },
}));

vi.mock('../api/generated/services/AuditionDatesService', () => ({
  AuditionDatesService: { getApiAuditionDates: vi.fn() },
}));

vi.mock('../api/generated/services/NotificationsService', () => ({
  NotificationsService: {
    getApiNotificationsAssignmentRecipients: vi.fn(),
    getApiNotificationsAuditionRecipients: vi.fn(),
    postApiNotificationsAssignmentAnnouncement: vi.fn(),
    postApiNotificationsAuditionAnnouncement: vi.fn(),
  },
}));

import NotificationsPage from './NotificationsPage';

const sampleProgramYears = [
  { id: 'py1', name: '2024-2025', isCurrent: true },
  { id: 'py2', name: '2023-2024', isCurrent: false },
];

const sampleAuditionDates = [
  { id: 'ad1', date: '2025-11-15' },
  { id: 'ad2', date: '2025-12-01' },
];

const sampleRecipients = [
  { memberId: 'mem1', name: 'Alice Soprano', email: 'alice@choir.org' },
  { memberId: 'mem2', name: 'Bob Bass', email: 'bob@choir.org' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false, isSuccess: false, isError: false, error: null });
});

test('renders notifications heading with data-testid="notifications-heading"', () => {
  renderPage();
  expect(screen.getByTestId('notifications-heading')).toBeInTheDocument();
  expect(screen.getByTestId('notifications-heading')).toHaveTextContent('Notifications');
});

test('renders type-select with assignment and audition options', () => {
  renderPage();
  const select = screen.getByTestId('type-select');
  expect(select).toBeInTheDocument();
  expect(screen.getByText('Assignment Announcement')).toBeInTheDocument();
  expect(screen.getByText('Audition Announcement')).toBeInTheDocument();
});

test('renders subject-input and body-input', () => {
  renderPage();
  expect(screen.getByTestId('subject-input')).toBeInTheDocument();
  expect(screen.getByTestId('body-input')).toBeInTheDocument();
});

test('renders preview-recipients-button and send-button', () => {
  renderPage();
  expect(screen.getByTestId('preview-recipients-button')).toBeInTheDocument();
  expect(screen.getByTestId('send-button')).toBeInTheDocument();
});

test('target-select shows program year options when type is assignment', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'program-years') return { data: sampleProgramYears, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByText('2024-2025')).toBeInTheDocument();
  expect(screen.getByText('2023-2024')).toBeInTheDocument();
});

test('label for target-select shows "Program Year" when type is assignment', () => {
  renderPage();
  expect(screen.getByText('Program Year')).toBeInTheDocument();
});

test('label for target-select shows "Audition Date" when type changes to audition', async () => {
  renderPage();
  const typeSelect = screen.getByTestId('type-select');
  await userEvent.selectOptions(typeSelect, 'audition');
  expect(screen.getByText('Audition Date')).toBeInTheDocument();
});

test('shows recipients-list when recipientsQuery returns data', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'notification-recipients') return { data: sampleRecipients, isLoading: false, isError: false };
    if (key === 'program-years') return { data: sampleProgramYears, isLoading: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByTestId('recipients-list')).toBeInTheDocument();
  expect(screen.getByTestId('recipient-mem1')).toBeInTheDocument();
  expect(screen.getByTestId('recipient-mem2')).toBeInTheDocument();
});

test('shows recipient name and email in recipients list', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'notification-recipients') return { data: sampleRecipients, isLoading: false, isError: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByText(/Alice Soprano/)).toBeInTheDocument();
  expect(screen.getByText(/alice@choir\.org/)).toBeInTheDocument();
});

test('shows recipients count in heading', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'notification-recipients') return { data: sampleRecipients, isLoading: false, isError: false };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByText(/Recipients \(2\)/)).toBeInTheDocument();
});

test('shows send-success message after successful mutation', () => {
  mockUseMutation.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
  });
  renderPage();
  expect(screen.getByTestId('send-success')).toBeInTheDocument();
  expect(screen.getByTestId('send-success')).toHaveTextContent('Announcement sent successfully');
});

test('shows send-error message when mutation fails', () => {
  mockUseMutation.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: true,
    error: new Error('Server error'),
  });
  renderPage();
  expect(screen.getByTestId('send-error')).toBeInTheDocument();
});

test('send button is disabled while mutation is pending', () => {
  mockUseMutation.mockReturnValue({
    mutate: vi.fn(),
    isPending: true,
    isSuccess: false,
    isError: false,
    error: null,
  });
  renderPage();
  expect(screen.getByTestId('send-button')).toBeDisabled();
});

test('recipients-error shown when recipientsQuery fails', () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'notification-recipients')
      return { data: undefined, isLoading: false, isError: true, error: new Error('Failed') };
    return { data: undefined, isLoading: false };
  });
  renderPage();
  expect(screen.getByTestId('recipients-error')).toBeInTheDocument();
});
