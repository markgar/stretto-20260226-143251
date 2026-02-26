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

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

import MembersListPage from './MembersListPage';

function renderMembersListPage() {
  return render(
    <MemoryRouter>
      <MembersListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: [], isLoading: false });
});

test('renders members heading with data-testid="members-heading"', () => {
  renderMembersListPage();
  expect(screen.getByTestId('members-heading')).toBeInTheDocument();
});

test('renders add member link with data-testid="add-member-button"', () => {
  renderMembersListPage();
  expect(screen.getByTestId('add-member-button')).toBeInTheDocument();
});

test('add member link points to /members/new', () => {
  renderMembersListPage();
  expect(screen.getByTestId('add-member-button')).toHaveAttribute('href', '/members/new');
});

test('renders search input with data-testid="search-input"', () => {
  renderMembersListPage();
  expect(screen.getByTestId('search-input')).toBeInTheDocument();
});

test('shows loading message while members are loading', () => {
  mockUseQuery.mockReturnValue({ data: [], isLoading: true });
  renderMembersListPage();
  expect(screen.getByText('Loading…')).toBeInTheDocument();
});

test('renders member full name in table rows', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true },
    ],
    isLoading: false,
  });
  renderMembersListPage();
  expect(screen.getByText('Alice Smith')).toBeInTheDocument();
});

test('renders member email in table rows', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true },
    ],
    isLoading: false,
  });
  renderMembersListPage();
  expect(screen.getByText('alice@example.com')).toBeInTheDocument();
});

test('renders active status badge for active member', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true }],
    isLoading: false,
  });
  renderMembersListPage();
  const badge = screen.getByTestId('status-badge-m1');
  expect(badge).toHaveTextContent('Active');
});

test('renders inactive status badge for inactive member', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'm1', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', role: 'Member', isActive: false }],
    isLoading: false,
  });
  renderMembersListPage();
  const badge = screen.getByTestId('status-badge-m1');
  expect(badge).toHaveTextContent('Inactive');
});

test('renders view link for each member row pointing to /members/:id', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true }],
    isLoading: false,
  });
  renderMembersListPage();
  expect(screen.getByTestId('view-m1')).toHaveAttribute('href', '/members/m1');
});

test('renders edit link for each member row pointing to /members/:id/edit', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true }],
    isLoading: false,
  });
  renderMembersListPage();
  expect(screen.getByTestId('edit-m1')).toHaveAttribute('href', '/members/m1/edit');
});

test('search input updates search state on change', async () => {
  renderMembersListPage();
  const searchInput = screen.getByTestId('search-input');
  await userEvent.type(searchInput, 'Alice');
  expect(searchInput).toHaveValue('Alice');
});
