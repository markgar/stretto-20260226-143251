import { vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock zustand
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

// Mock react-hook-form
const mockHandleSubmit = vi.fn();
const mockRegister = vi.fn(() => ({ name: 'email', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }));
const mockSetValue = vi.fn();

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    formState: { errors: {}, isSubmitting: false },
    setValue: mockSetValue,
  }),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => vi.fn()),
}));

import LoginPage from './LoginPage';

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-heading">Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHandleSubmit.mockImplementation((fn: (values: { email: string }) => void) => (e: Event) => {
    e?.preventDefault?.();
    fn({ email: 'user@example.com' });
  });
});

test('renders email input with data-testid="email-input"', () => {
  renderLoginPage();
  expect(screen.getByTestId('email-input')).toBeInTheDocument();
});

test('renders submit button with data-testid="login-button"', () => {
  renderLoginPage();
  expect(screen.getByTestId('login-button')).toBeInTheDocument();
});

test('renders sign in heading', () => {
  renderLoginPage();
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});

test('shows API error message when fetch returns non-200', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
  renderLoginPage();
  const button = screen.getByTestId('login-button');
  await userEvent.click(button);
  await waitFor(() => {
    expect(screen.getByText('Invalid email or account not found')).toBeInTheDocument();
  });
});

test('navigates to /dashboard on successful login', async () => {
  const mockUser = {
    id: '1', email: 'user@example.com', firstName: 'Jane', lastName: 'Doe',
    role: 'Admin', orgId: 'org1', orgName: 'Orchestra',
  };
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(mockUser),
  });
  renderLoginPage();
  const button = screen.getByTestId('login-button');
  await userEvent.click(button);
  await waitFor(() => {
    expect(screen.getByTestId('dashboard-heading')).toBeInTheDocument();
  });
});

test('shows error when fetch throws a network error', async () => {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
  renderLoginPage();
  const button = screen.getByTestId('login-button');
  await userEvent.click(button);
  await waitFor(() => {
    expect(screen.getByText('Invalid email or account not found')).toBeInTheDocument();
  });
});
