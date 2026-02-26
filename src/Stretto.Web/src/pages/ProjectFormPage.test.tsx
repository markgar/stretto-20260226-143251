import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, setAuthUser } from '../mocks/testUtils';

import ProjectFormPage from './ProjectFormPage';

function renderNewProjectForm(queryClient = createQueryClient(), programYearId = 'py1') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/new?programYearId=${programYearId}`]}>
        <Routes>
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:id" element={<div data-testid="project-detail">Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderEditProjectForm(queryClient = createQueryClient(), id: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/${id}/edit`]}>
        <Routes>
          <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="/projects/:id" element={<div data-testid="project-detail">Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setAuthUser(null));
afterEach(() => setAuthUser(null));

test('renders "Add Project" heading when creating a new project', () => {
  renderNewProjectForm();
  expect(screen.getByRole('heading', { name: 'Add Project' })).toBeInTheDocument();
});

test('renders "Edit Project" heading when editing an existing project', () => {
  const qc = createQueryClient();
  qc.setQueryData(['project', 'p1'], { id: 'p1', name: 'Spring Concert', startDate: '2025-10-01', endDate: '2025-11-30' });
  renderEditProjectForm(qc, 'p1');
  expect(screen.getByRole('heading', { name: 'Edit Project' })).toBeInTheDocument();
});

test('renders name, start date, end date inputs and submit button', () => {
  renderNewProjectForm();
  expect(screen.getByTestId('name-input')).toBeInTheDocument();
  expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
  expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
  expect(screen.getByTestId('submit-button')).toBeInTheDocument();
});

test('shows end date validation error when end date is before start date', async () => {
  renderNewProjectForm();
  await userEvent.type(screen.getByTestId('name-input'), 'Test Project');
  await userEvent.type(screen.getByTestId('start-date-input'), '2025-11-30');
  await userEvent.type(screen.getByTestId('end-date-input'), '2025-10-01');
  await userEvent.click(screen.getByTestId('submit-button'));
  await waitFor(() => {
    expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
  });
});

test('shows name validation error when name is empty', async () => {
  renderNewProjectForm();
  await userEvent.click(screen.getByTestId('submit-button'));
  await waitFor(() => {
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});

