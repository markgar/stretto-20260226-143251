import { vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

vi.mock('../api/generated/services/AttendanceService', () => ({
  AttendanceService: {
    postApiCheckin: vi.fn(),
  },
}));

import CheckInPage from './CheckInPage';

function renderPage(eventId = 'event-abc') {
  return render(
    <MemoryRouter initialEntries={[`/checkin/${eventId}`]}>
      <Routes>
        <Route path="/checkin/:eventId" element={<CheckInPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

test('renders checkin-button with data-testid', () => {
  renderPage();
  expect(screen.getByTestId('checkin-button')).toBeInTheDocument();
});

test('renders "Check In" heading', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'Check In' })).toBeInTheDocument();
});

test('renders button labeled "I\'m here"', () => {
  renderPage();
  expect(screen.getByTestId('checkin-button')).toHaveTextContent("I'm here");
});

test('checkin-button is disabled while mutation is pending', () => {
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: true });
  renderPage();
  expect(screen.getByTestId('checkin-button')).toBeDisabled();
});

test('shows checkin-success message after successful mutation', () => {
  let capturedOnSuccess: (() => void) | undefined;
  mockUseMutation.mockImplementation(({ onSuccess }: { onSuccess?: () => void }) => {
    capturedOnSuccess = onSuccess;
    return { mutate: vi.fn(), isPending: false };
  });
  renderPage();
  act(() => { capturedOnSuccess?.(); });
  expect(screen.getByTestId('checkin-success')).toBeInTheDocument();
  expect(screen.getByTestId('checkin-success')).toHaveTextContent("You're checked in!");
});

test('hides checkin-button after successful check-in', () => {
  let capturedOnSuccess: (() => void) | undefined;
  mockUseMutation.mockImplementation(({ onSuccess }: { onSuccess?: () => void }) => {
    capturedOnSuccess = onSuccess;
    return { mutate: vi.fn(), isPending: false };
  });
  renderPage();
  act(() => { capturedOnSuccess?.(); });
  expect(screen.queryByTestId('checkin-button')).not.toBeInTheDocument();
});

test('shows error message after failed mutation', () => {
  let capturedOnError: (() => void) | undefined;
  mockUseMutation.mockImplementation(({ onError }: { onError?: () => void }) => {
    capturedOnError = onError;
    return { mutate: vi.fn(), isPending: false };
  });
  renderPage();
  act(() => { capturedOnError?.(); });
  expect(screen.getByText(/Check-in failed/i)).toBeInTheDocument();
});
