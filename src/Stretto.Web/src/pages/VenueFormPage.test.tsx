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

import VenueFormPage from './VenueFormPage';

function renderNewVenueForm() {
  return render(
    <MemoryRouter initialEntries={['/venues/new']}>
      <Routes>
        <Route path="/venues/new" element={<VenueFormPage />} />
        <Route path="/venues" element={<div data-testid="venues-list">Venues List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditVenueForm(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/venues/${id}/edit`]}>
      <Routes>
        <Route path="/venues/:id/edit" element={<VenueFormPage />} />
        <Route path="/venues" element={<div data-testid="venues-list">Venues List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFormErrors = {};
  mockHandleSubmit.mockImplementation((fn: (values: Record<string, string>) => void) => (e: Event) => {
    e?.preventDefault?.();
    fn({ name: 'Test Venue', address: '123 Main St' });
  });
  mockUseQuery.mockReturnValue({ data: undefined });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

test('renders name input with data-testid="name-input"', () => {
  renderNewVenueForm();
  expect(screen.getByTestId('name-input')).toBeInTheDocument();
});

test('renders address input with data-testid="address-input"', () => {
  renderNewVenueForm();
  expect(screen.getByTestId('address-input')).toBeInTheDocument();
});

test('renders contact name input with data-testid="contact-name-input"', () => {
  renderNewVenueForm();
  expect(screen.getByTestId('contact-name-input')).toBeInTheDocument();
});

test('renders contact email input with data-testid="contact-email-input"', () => {
  renderNewVenueForm();
  expect(screen.getByTestId('contact-email-input')).toBeInTheDocument();
});

test('renders contact phone input with data-testid="contact-phone-input"', () => {
  renderNewVenueForm();
  expect(screen.getByTestId('contact-phone-input')).toBeInTheDocument();
});

test('renders submit button with data-testid="submit-button"', () => {
  renderNewVenueForm();
  expect(screen.getByTestId('submit-button')).toBeInTheDocument();
});

test('shows "Add Venue" heading when creating a new venue', () => {
  renderNewVenueForm();
  expect(screen.getByRole('heading', { name: 'Add Venue' })).toBeInTheDocument();
});

test('shows "Edit Venue" heading when editing an existing venue', () => {
  mockUseQuery.mockReturnValue({ data: { id: 'v1', name: 'City Hall', address: '123 Main St' } });
  renderEditVenueForm('v1');
  expect(screen.getByRole('heading', { name: 'Edit Venue' })).toBeInTheDocument();
});

test('navigates to /venues after successful save', async () => {
  let onSuccess: (() => void) | undefined;
  mockUseMutation.mockImplementation((opts: { onSuccess: () => void }) => {
    onSuccess = opts.onSuccess;
    return { mutate: vi.fn(), isPending: false };
  });
  renderNewVenueForm();
  onSuccess?.();
  await waitFor(() => {
    expect(screen.getByTestId('venues-list')).toBeInTheDocument();
  });
});

test('shows inline error message for name field when validation fails', () => {
  mockFormErrors = { name: { message: 'Name is required' } };
  renderNewVenueForm();
  expect(screen.getByText('Name is required')).toBeInTheDocument();
});
