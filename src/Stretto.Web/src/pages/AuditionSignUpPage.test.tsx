import { vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

const mockHandleSubmit = vi.fn();
const mockRegister = vi.fn(() => ({ name: 'field', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }));
let mockFormErrors: Record<string, { message: string }> = {};

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    formState: { errors: mockFormErrors, isSubmitting: false },
  }),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => vi.fn()),
}));

import AuditionSignUpPage from './AuditionSignUpPage';

const sampleAuditionDate = {
  id: 'date-1',
  date: '2025-11-15',
  startTime: '10:00',
  endTime: '12:00',
  blockLengthMinutes: 15,
  slots: [
    { id: 'slot-1', slotTime: '10:00', isAvailable: true },
    { id: 'slot-2', slotTime: '10:15', isAvailable: false },
    { id: 'slot-3', slotTime: '10:30', isAvailable: true },
  ],
};

function renderPage(auditionDateId = 'date-1') {
  return render(
    <MemoryRouter initialEntries={[`/auditions/${auditionDateId}`]}>
      <Routes>
        <Route path="/auditions/:auditionDateId" element={<AuditionSignUpPage />} />
        <Route path="/auditions/confirmation" element={<div data-testid="confirmation-page">Confirmed</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFormErrors = {};
  mockHandleSubmit.mockImplementation(
    (fn: (values: { firstName: string; lastName: string; email: string }) => void) =>
      (e: Event) => {
        e?.preventDefault?.();
        fn({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' });
      },
  );
  mockUseQuery.mockReturnValue({ data: sampleAuditionDate, isLoading: false, isError: false });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false, mutateAsync: vi.fn() });
});

test('renders Audition Sign-Up heading', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: /audition sign-up/i })).toBeInTheDocument();
});

test('renders formatted date and time range in header', () => {
  renderPage();
  expect(screen.getByText(/November 15, 2025/)).toBeInTheDocument();
});

test('renders Available badge for available slot', () => {
  renderPage();
  expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
});

test('renders Taken badge for unavailable slot', () => {
  renderPage();
  expect(screen.getByText('Taken')).toBeInTheDocument();
});

test('renders Sign Up button only for available slots', () => {
  renderPage();
  const buttons = screen.getAllByText('Sign Up');
  expect(buttons).toHaveLength(2);
});

test('Sign Up buttons have data-testid with slot id', () => {
  renderPage();
  expect(screen.getByTestId('signup-slot-1')).toBeInTheDocument();
  expect(screen.getByTestId('signup-slot-3')).toBeInTheDocument();
});

test('clicking Sign Up renders sign-up form with first-name-input', async () => {
  renderPage();
  await userEvent.click(screen.getByTestId('signup-slot-1'));
  expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
});

test('clicking Sign Up renders last-name-input and email-input', async () => {
  renderPage();
  await userEvent.click(screen.getByTestId('signup-slot-1'));
  expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
  expect(screen.getByTestId('email-input')).toBeInTheDocument();
});

test('clicking Sign Up renders submit-signup button', async () => {
  renderPage();
  await userEvent.click(screen.getByTestId('signup-slot-1'));
  expect(screen.getByTestId('submit-signup')).toBeInTheDocument();
});

test('submit-signup calls mutation.mutate', async () => {
  const mockMutate = vi.fn();
  mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
  renderPage();
  await userEvent.click(screen.getByTestId('signup-slot-1'));
  await userEvent.click(screen.getByTestId('submit-signup'));
  expect(mockMutate).toHaveBeenCalled();
});

test('submit-signup button is disabled while mutation isPending', async () => {
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: true });
  renderPage();
  await userEvent.click(screen.getByTestId('signup-slot-1'));
  expect(screen.getByTestId('submit-signup')).toBeDisabled();
});

test('navigates to confirmation page on successful sign-up', async () => {
  let capturedOnSuccess: (() => void) | undefined;
  mockUseMutation.mockImplementation(({ onSuccess }: { onSuccess?: () => void }) => {
    capturedOnSuccess = onSuccess;
    return { mutate: vi.fn(), isPending: false };
  });
  renderPage();
  await userEvent.click(screen.getByTestId('signup-slot-1'));
  act(() => { capturedOnSuccess?.(); });
  expect(screen.getByTestId('confirmation-page')).toBeInTheDocument();
});

test('shows API error message on sign-up failure', async () => {
  let capturedOnError: ((err: Error) => void) | undefined;
  mockUseMutation.mockImplementation(({ onError }: { onError?: (err: Error) => void }) => {
    capturedOnError = onError;
    return { mutate: vi.fn(), isPending: false };
  });
  renderPage();
  await userEvent.click(screen.getByTestId('signup-slot-1'));
  act(() => { capturedOnError?.(new Error('Slot already taken')); });
  expect(screen.getByText('Slot already taken')).toBeInTheDocument();
});

test('shows loading state while fetching audition date', () => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
  renderPage();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test('shows error state when audition date fetch fails', () => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
  renderPage();
  expect(screen.getByText(/could not load/i)).toBeInTheDocument();
});
