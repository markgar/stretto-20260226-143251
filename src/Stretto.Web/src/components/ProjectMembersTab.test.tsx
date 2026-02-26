import { vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockUseQueryClient = vi.fn(() => ({ invalidateQueries: mockInvalidateQueries }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

vi.mock('../api/generated/services/ProjectsService', () => ({
  ProjectsService: {
    getApiProjectsMembers: vi.fn(),
    postApiProjectsMembers: vi.fn(),
    deleteApiProjectsMembers: vi.fn(),
  },
}));

import ProjectMembersTab from './ProjectMembersTab';

const sampleMembers = [
  { memberId: 'm1', fullName: 'Alice Smith', email: 'alice@example.com', isAssigned: false },
  { memberId: 'm2', fullName: 'Bob Jones', email: 'bob@example.com', isAssigned: true },
];

function renderTab(projectId = 'p1') {
  return render(<ProjectMembersTab projectId={projectId} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseQuery.mockReturnValue({ data: sampleMembers, isLoading: false });
});

test('renders search input with correct data-testid', () => {
  renderTab();
  expect(screen.getByTestId('member-search-input')).toBeInTheDocument();
});

test('renders Assign button for unassigned member with correct data-testid', () => {
  renderTab();
  expect(screen.getByTestId('assign-m1')).toBeInTheDocument();
});

test('renders Unassign button for assigned member with correct data-testid', () => {
  renderTab();
  expect(screen.getByTestId('unassign-m2')).toBeInTheDocument();
});

test('renders member full name and email in the table', () => {
  renderTab();
  expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  expect(screen.getByText('bob@example.com')).toBeInTheDocument();
});

test('shows skeleton loader while data is loading', () => {
  mockUseQuery.mockReturnValue({ data: [], isLoading: true });
  renderTab();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('shows empty state when no members found', () => {
  mockUseQuery.mockReturnValue({ data: [], isLoading: false });
  renderTab();
  expect(screen.getByText(/No members found/i)).toBeInTheDocument();
});

test('filters member list by name when typing in search input', async () => {
  renderTab();
  const input = screen.getByTestId('member-search-input');
  await userEvent.type(input, 'alice');
  expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
});

test('filters member list by email when typing in search input', async () => {
  renderTab();
  const input = screen.getByTestId('member-search-input');
  await userEvent.type(input, 'bob@');
  expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
});

test('calls assign mutation when Assign button is clicked', async () => {
  const mutate = vi.fn();
  mockUseMutation.mockReturnValue({ mutate, isPending: false });
  renderTab();
  await userEvent.click(screen.getByTestId('assign-m1'));
  expect(mutate).toHaveBeenCalledWith('m1');
});

test('calls unassign mutation when Unassign button is clicked', async () => {
  const mutate = vi.fn();
  mockUseMutation.mockImplementation(({ mutationFn }: { mutationFn: unknown }) => {
    // second useMutation call is unassign
    return { mutate, isPending: false };
  });
  renderTab();
  await userEvent.click(screen.getByTestId('unassign-m2'));
  expect(mutate).toHaveBeenCalled();
});

test('disables buttons while a mutation is pending', () => {
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: true });
  renderTab();
  expect(screen.getByTestId('assign-m1')).toBeDisabled();
  expect(screen.getByTestId('unassign-m2')).toBeDisabled();
});

test('displays inline error message when mutation fails', () => {
  let errorCallback: (() => void) | undefined;
  mockUseMutation.mockImplementation(({ onError }: { onError: () => void }) => {
    errorCallback = onError;
    return { mutate: vi.fn(), isPending: false };
  });
  renderTab();
  act(() => { errorCallback?.(); });
  expect(screen.getByText(/Failed to/i)).toBeInTheDocument();
});
