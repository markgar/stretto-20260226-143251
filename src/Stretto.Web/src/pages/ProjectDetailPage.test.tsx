import { vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const mockUseQueryClient = vi.fn(() => ({ invalidateQueries: vi.fn() }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

import ProjectDetailPage from './ProjectDetailPage';

const sampleProject = {
  id: 'p1',
  name: 'Spring Concert',
  startDate: '2025-10-01',
  endDate: '2025-11-30',
  programYearId: 'py1',
};

function renderPage(id = 'p1') {
  return render(
    <MemoryRouter initialEntries={[`/projects/${id}`]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/edit" element={<div data-testid="project-form">Edit Form</div>} />
        <Route path="/program-years/:id" element={<div data-testid="program-years-detail">PY Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

test('renders project name as heading when data loads', () => {
  mockUseQuery.mockReturnValue({ data: sampleProject, isLoading: false, isError: false });
  renderPage();
  expect(screen.getByRole('heading', { name: 'Spring Concert' })).toBeInTheDocument();
});

test('renders Overview, Events, Members, Materials tabs', () => {
  mockUseQuery.mockReturnValue({ data: sampleProject, isLoading: false, isError: false });
  renderPage();
  expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
  expect(screen.getByTestId('tab-events')).toBeInTheDocument();
  expect(screen.getByTestId('tab-members')).toBeInTheDocument();
  expect(screen.getByTestId('tab-materials')).toBeInTheDocument();
});

test('clicking Events tab renders events content', async () => {
  // project query returns sampleProject, events query returns empty array
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'events') return { data: [], isLoading: false, isError: false };
    return { data: sampleProject, isLoading: false, isError: false };
  });
  renderPage();
  await userEvent.click(screen.getByTestId('tab-events'));
  expect(screen.getByText(/No events scheduled yet/i)).toBeInTheDocument();
});

test('shows skeleton loader while project is loading', () => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
  renderPage();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('shows inline error when project fetch fails', () => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
  renderPage();
  expect(screen.getByText(/Failed to load project/i)).toBeInTheDocument();
});

test('clicking Members tab renders ProjectMembersTab with search input', async () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'projectMembers') return { data: [], isLoading: false };
    return { data: sampleProject, isLoading: false, isError: false };
  });
  renderPage();
  await userEvent.click(screen.getByTestId('tab-members'));
  expect(screen.getByTestId('member-search-input')).toBeInTheDocument();
});

test('clicking Members tab no longer shows "Coming soon" placeholder', async () => {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts?.queryKey?.[0];
    if (key === 'projectMembers') return { data: [], isLoading: false };
    return { data: sampleProject, isLoading: false, isError: false };
  });
  renderPage();
  await userEvent.click(screen.getByTestId('tab-members'));
  expect(screen.queryByText(/Coming soon/i)).not.toBeInTheDocument();
});
