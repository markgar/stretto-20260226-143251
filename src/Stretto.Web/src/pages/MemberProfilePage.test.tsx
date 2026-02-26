import { vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

import MemberProfilePage from './MemberProfilePage';

function renderMemberProfile(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/members/${id}`]}>
      <Routes>
        <Route path="/members/:id" element={<MemberProfilePage />} />
        <Route path="/members/:id/edit" element={<div data-testid="edit-form">Edit Form</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined });
});

test('renders member name with data-testid="member-name"', () => {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'member') return { data: { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true } };
    return { data: [] };
  });
  renderMemberProfile('m1');
  expect(screen.getByTestId('member-name')).toHaveTextContent('Alice Smith');
});

test('renders status badge with data-testid="status-badge"', () => {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'member') return { data: { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true } };
    return { data: [] };
  });
  renderMemberProfile('m1');
  expect(screen.getByTestId('status-badge')).toBeInTheDocument();
});

test('status badge shows "Active" for active member', () => {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'member') return { data: { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true } };
    return { data: [] };
  });
  renderMemberProfile('m1');
  expect(screen.getByTestId('status-badge')).toHaveTextContent('Active');
});

test('status badge shows "Inactive" for inactive member', () => {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'member') return { data: { id: 'm1', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', role: 'Member', isActive: false } };
    return { data: [] };
  });
  renderMemberProfile('m1');
  expect(screen.getByTestId('status-badge')).toHaveTextContent('Inactive');
});

test('renders edit link with data-testid="edit-link"', () => {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'member') return { data: { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true } };
    return { data: [] };
  });
  renderMemberProfile('m1');
  expect(screen.getByTestId('edit-link')).toHaveAttribute('href', '/members/m1/edit');
});

test('renders assignments heading with data-testid="assignments-heading"', () => {
  mockUseQuery.mockReturnValue({ data: [] });
  renderMemberProfile('m1');
  expect(screen.getByTestId('assignments-heading')).toBeInTheDocument();
});

test('shows no-assignments message when member has no projects', () => {
  mockUseQuery.mockReturnValue({ data: [] });
  renderMemberProfile('m1');
  expect(screen.getByTestId('no-assignments')).toBeInTheDocument();
});

test('renders assignment list items when member has projects', () => {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'member-assignments') {
      return { data: [{ projectId: 'p1', projectName: 'Spring Concert' }] };
    }
    return { data: { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true } };
  });
  renderMemberProfile('m1');
  expect(screen.getByTestId('assignment-p1')).toHaveTextContent('Spring Concert');
});

test('does not show no-assignments message when member has projects', () => {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'member-assignments') {
      return { data: [{ projectId: 'p1', projectName: 'Spring Concert' }] };
    }
    return { data: { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true } };
  });
  renderMemberProfile('m1');
  expect(screen.queryByTestId('no-assignments')).not.toBeInTheDocument();
});
