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
const mockUseMutation = vi.fn();
const mockUseQueryClient = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

import VenuesListPage from './VenuesListPage';

const mockQueryClient = { invalidateQueries: vi.fn() };

function renderVenuesListPage() {
  return render(
    <MemoryRouter>
      <VenuesListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: [], isLoading: false });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseQueryClient.mockReturnValue(mockQueryClient);
});

test('renders venues heading with data-testid="venues-heading"', () => {
  renderVenuesListPage();
  expect(screen.getByTestId('venues-heading')).toBeInTheDocument();
});

test('renders add venue link with data-testid="add-venue-button"', () => {
  renderVenuesListPage();
  expect(screen.getByTestId('add-venue-button')).toBeInTheDocument();
});

test('add venue link points to /venues/new', () => {
  renderVenuesListPage();
  expect(screen.getByTestId('add-venue-button')).toHaveAttribute('href', '/venues/new');
});

test('shows loading message while venues are loading', () => {
  mockUseQuery.mockReturnValue({ data: [], isLoading: true });
  renderVenuesListPage();
  expect(screen.getByText('Loading…')).toBeInTheDocument();
});

test('renders venue name and address in table rows', () => {
  mockUseQuery.mockReturnValue({
    data: [
      { id: 'v1', name: 'City Hall', address: '123 Main St' },
      { id: 'v2', name: 'Grand Theatre', address: '456 Oak Ave' },
    ],
    isLoading: false,
  });
  renderVenuesListPage();
  expect(screen.getByText('City Hall')).toBeInTheDocument();
  expect(screen.getByText('Grand Theatre')).toBeInTheDocument();
});

test('renders edit link for each venue row', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'v1', name: 'City Hall', address: '123 Main St' }],
    isLoading: false,
  });
  renderVenuesListPage();
  expect(screen.getByTestId('edit-venue-v1')).toHaveAttribute('href', '/venues/v1/edit');
});

test('renders delete button for each venue row', () => {
  mockUseQuery.mockReturnValue({
    data: [{ id: 'v1', name: 'City Hall', address: '123 Main St' }],
    isLoading: false,
  });
  renderVenuesListPage();
  expect(screen.getByTestId('delete-venue-v1')).toBeInTheDocument();
});

test('clicking delete calls mutate with venue id', async () => {
  const mockMutate = vi.fn();
  mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
  mockUseQuery.mockReturnValue({
    data: [{ id: 'v1', name: 'City Hall', address: '123 Main St' }],
    isLoading: false,
  });
  renderVenuesListPage();
  await userEvent.click(screen.getByTestId('delete-venue-v1'));
  expect(mockMutate).toHaveBeenCalledWith('v1');
});

test('shows contact info as name / email / phone joined by " / "', () => {
  mockUseQuery.mockReturnValue({
    data: [
      {
        id: 'v1',
        name: 'City Hall',
        address: '123 Main St',
        contactName: 'Jane Doe',
        contactEmail: 'jane@example.com',
        contactPhone: '555-1234',
      },
    ],
    isLoading: false,
  });
  renderVenuesListPage();
  expect(screen.getByText('Jane Doe / jane@example.com / 555-1234')).toBeInTheDocument();
});
