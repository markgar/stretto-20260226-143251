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
const mockUseQueryClient = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

import EventDetailPage from './EventDetailPage';
import { useAuthStore } from '../stores/authStore';

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Member';
  orgId: string;
  orgName: string;
};

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'Admin',
  orgId: 'org-1',
  orgName: 'Test Org',
};

const memberUser: AuthUser = {
  id: 'member-1',
  email: 'member@example.com',
  firstName: 'Alice',
  lastName: 'Member',
  role: 'Member',
  orgId: 'org-1',
  orgName: 'Test Org',
};

const sampleEvent = {
  id: 'e1',
  type: 0,
  date: '2025-10-15',
  startTime: '18:30',
  durationMinutes: 120,
  venueName: 'City Hall',
  projectId: 'p1',
};

const sampleAttendance = [
  { memberId: 'm1', memberName: 'Alice Alto', status: 'Present' },
  { memberId: 'm2', memberName: 'Bob Bass', status: 'Absent' },
  { memberId: 'm3', memberName: 'Carol Cello', status: null },
];

function renderPage(id = 'e1') {
  return render(
    <MemoryRouter initialEntries={[`/events/${id}`]}>
      <Routes>
        <Route path="/events/:id" element={<EventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function setStoreUser(user: AuthUser | null) {
  // Directly mutate the state to avoid localStorage calls (not available in this jsdom setup)
  Object.assign(useAuthStore.getState(), { user });
}

beforeEach(() => {
  vi.clearAllMocks();
  setStoreUser(null);
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseQueryClient.mockReturnValue({ invalidateQueries: vi.fn() });
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
});

test('admin user sees attendance-panel', () => {
  setStoreUser(adminUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return { data: sampleAttendance, isLoading: false };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage();
  expect(screen.getByTestId('attendance-panel')).toBeInTheDocument();
});

test('admin user sees checkin-url containing event id', () => {
  setStoreUser(adminUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return { data: [], isLoading: false };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage('e1');
  expect(screen.getByTestId('checkin-url')).toHaveTextContent('/checkin/e1');
});

test('non-admin user does not see attendance-panel', () => {
  setStoreUser(memberUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return { data: [], isLoading: false };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage();
  expect(screen.queryByTestId('attendance-panel')).not.toBeInTheDocument();
});

test('admin attendance panel shows member names from attendance list', () => {
  setStoreUser(adminUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return { data: sampleAttendance, isLoading: false };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage();
  expect(screen.getByText('Alice Alto')).toBeInTheDocument();
  expect(screen.getByText('Bob Bass')).toBeInTheDocument();
});

test('attendance panel shows Present status badge in green', () => {
  setStoreUser(adminUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return {
      data: [{ memberId: 'm1', memberName: 'Alice Alto', status: 'Present' }],
      isLoading: false,
    };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage();
  const badge = screen.getByText('Present', { selector: 'span' });
  expect(badge).toBeInTheDocument();
  expect(badge.className).toMatch(/green/);
});

test('attendance panel shows Excused status badge in amber', () => {
  setStoreUser(adminUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return {
      data: [{ memberId: 'm1', memberName: 'Alice Alto', status: 'Excused' }],
      isLoading: false,
    };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage();
  const badge = screen.getByText('Excused', { selector: 'span' });
  expect(badge).toBeInTheDocument();
  expect(badge.className).toMatch(/amber/);
});

test('member user sees excuse-toggle button', () => {
  setStoreUser(memberUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return {
      data: [{ memberId: 'member-1', memberName: 'Alice Member', status: null }],
      isLoading: false,
    };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage();
  expect(screen.getByTestId('excuse-toggle')).toBeInTheDocument();
});

test('excuse-toggle shows "Excuse my absence" when member is not excused', () => {
  setStoreUser(memberUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return {
      data: [{ memberId: 'member-1', memberName: 'Alice Member', status: 'Present' }],
      isLoading: false,
    };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage();
  expect(screen.getByTestId('excuse-toggle')).toHaveTextContent('Excuse my absence');
});

test('excuse-toggle shows "Remove excuse" when member is currently excused', () => {
  setStoreUser(memberUser);
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'event') return { data: sampleEvent, isLoading: false, isError: false };
    if (queryKey[0] === 'attendance') return {
      data: [{ memberId: 'member-1', memberName: 'Alice Member', status: 'Excused' }],
      isLoading: false,
    };
    return { data: undefined, isLoading: false, isError: false };
  });
  renderPage();
  expect(screen.getByTestId('excuse-toggle')).toHaveTextContent('Remove excuse');
});
