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

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

import MemberFormPage from './MemberFormPage';

function renderNewMemberForm() {
  return render(
    <MemoryRouter initialEntries={['/members/new']}>
      <Routes>
        <Route path="/members/new" element={<MemberFormPage />} />
        <Route path="/members/:id" element={<div data-testid="member-profile">Member Profile</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditMemberForm(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/members/${id}/edit`]}>
      <Routes>
        <Route path="/members/:id/edit" element={<MemberFormPage />} />
        <Route path="/members/:id" element={<div data-testid="member-profile">Member Profile</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFormErrors = {};
  mockHandleSubmit.mockImplementation((fn: (values: Record<string, unknown>) => void) => (e: Event) => {
    e?.preventDefault?.();
    fn({ firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true });
  });
  mockUseQuery.mockReturnValue({ data: undefined });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
});

test('renders first name input with data-testid="first-name-input"', () => {
  renderNewMemberForm();
  expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
});

test('renders last name input with data-testid="last-name-input"', () => {
  renderNewMemberForm();
  expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
});

test('renders email input with data-testid="email-input"', () => {
  renderNewMemberForm();
  expect(screen.getByTestId('email-input')).toBeInTheDocument();
});

test('renders role select with data-testid="role-select"', () => {
  renderNewMemberForm();
  expect(screen.getByTestId('role-select')).toBeInTheDocument();
});

test('renders submit button with data-testid="submit-button"', () => {
  renderNewMemberForm();
  expect(screen.getByTestId('submit-button')).toBeInTheDocument();
});

test('shows "Add Member" heading when creating a new member', () => {
  renderNewMemberForm();
  expect(screen.getByRole('heading', { name: 'Add Member' })).toBeInTheDocument();
});

test('shows "Edit Member" heading when editing an existing member', () => {
  mockUseQuery.mockReturnValue({
    data: { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true },
  });
  renderEditMemberForm('m1');
  expect(screen.getByRole('heading', { name: 'Edit Member' })).toBeInTheDocument();
});

test('shows is-active checkbox when editing an existing member', () => {
  mockUseQuery.mockReturnValue({
    data: { id: 'm1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', role: 'Member', isActive: true },
  });
  renderEditMemberForm('m1');
  expect(screen.getByTestId('is-active-checkbox')).toBeInTheDocument();
});

test('does not show is-active checkbox when creating a new member', () => {
  renderNewMemberForm();
  expect(screen.queryByTestId('is-active-checkbox')).not.toBeInTheDocument();
});

test('navigates to member profile after successful create', async () => {
  let onSuccess: ((dto: { id: string }) => void) | undefined;
  mockUseMutation.mockImplementation((opts: { onSuccess: (dto: { id: string }) => void }) => {
    onSuccess = opts.onSuccess;
    return { mutate: vi.fn(), isPending: false, isError: false };
  });
  renderNewMemberForm();
  onSuccess?.({ id: 'new-m1' });
  await waitFor(() => {
    expect(screen.getByTestId('member-profile')).toBeInTheDocument();
  });
});

test('shows inline validation error for first name field', () => {
  mockFormErrors = { firstName: { message: 'First name is required' } };
  renderNewMemberForm();
  expect(screen.getByText('First name is required')).toBeInTheDocument();
});

test('shows inline validation error for email field', () => {
  mockFormErrors = { email: { message: 'Valid email required' } };
  renderNewMemberForm();
  expect(screen.getByText('Valid email required')).toBeInTheDocument();
});

test('shows form-level error message when mutation fails', () => {
  mockUseMutation.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: true,
    error: new Error('Email already in use'),
  });
  renderNewMemberForm();
  expect(screen.getByTestId('form-error')).toHaveTextContent('Email already in use');
});
