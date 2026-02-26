import { vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

import ProjectFormPage from './ProjectFormPage';

function renderNewProjectForm(programYearId = 'py1') {
  return render(
    <MemoryRouter initialEntries={[`/projects/new?programYearId=${programYearId}`]}>
      <Routes>
        <Route path="/projects/new" element={<ProjectFormPage />} />
        <Route path="/projects/:id" element={<div data-testid="project-detail">Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditProjectForm(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/projects/${id}/edit`]}>
      <Routes>
        <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
        <Route path="/projects/:id" element={<div data-testid="project-detail">Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFormErrors = {};
  mockHandleSubmit.mockImplementation((fn: (values: Record<string, string>) => void) => (e: Event) => {
    e?.preventDefault?.();
    fn({ name: 'Spring Concert', startDate: '2025-10-01', endDate: '2025-11-30' });
  });
  mockUseQuery.mockReturnValue({ data: undefined });
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
});

test('renders "Add Project" heading when creating a new project', () => {
  renderNewProjectForm();
  expect(screen.getByRole('heading', { name: 'Add Project' })).toBeInTheDocument();
});

test('renders "Edit Project" heading when editing an existing project', () => {
  mockUseQuery.mockReturnValue({ data: { id: 'p1', name: 'Spring Concert', startDate: '2025-10-01', endDate: '2025-11-30' } });
  renderEditProjectForm('p1');
  expect(screen.getByRole('heading', { name: 'Edit Project' })).toBeInTheDocument();
});

test('renders name, start date, end date inputs and submit button', () => {
  renderNewProjectForm();
  expect(screen.getByTestId('name-input')).toBeInTheDocument();
  expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
  expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
  expect(screen.getByTestId('submit-button')).toBeInTheDocument();
});

test('shows end date validation error when end date is before start date', () => {
  mockFormErrors = { endDate: { message: 'End date must be after start date' } };
  renderNewProjectForm();
  expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
});

test('shows name validation error when name is empty', () => {
  mockFormErrors = { name: { message: 'Name is required' } };
  renderNewProjectForm();
  expect(screen.getByText('Name is required')).toBeInTheDocument();
});
