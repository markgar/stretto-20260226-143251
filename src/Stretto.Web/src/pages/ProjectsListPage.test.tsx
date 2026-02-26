import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { createQueryClient, setAuthUser, adminUser } from '../mocks/testUtils';
import { QueryClientProvider } from '@tanstack/react-query';

import ProjectsListPage from './ProjectsListPage';

function renderPage(queryClient = createQueryClient(), search = '?programYearId=py1') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects${search}`]}>
        <Routes>
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<div data-testid="project-detail">Detail</div>} />
          <Route path="/projects/new" element={<div data-testid="project-form">Form</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setAuthUser(null));
afterEach(() => setAuthUser(null));

test('renders projects heading with data-testid="projects-heading"', () => {
  const qc = createQueryClient();
  qc.setQueryData(['projects', 'py1'], []);
  renderPage(qc);
  expect(screen.getByTestId('projects-heading')).toBeInTheDocument();
});

test('shows empty state message when no projects exist', () => {
  const qc = createQueryClient();
  qc.setQueryData(['projects', 'py1'], []);
  renderPage(qc);
  expect(screen.getByText(/No projects yet/i)).toBeInTheDocument();
});

test('renders project rows with name linked to project detail', () => {
  const qc = createQueryClient();
  qc.setQueryData(['projects', 'py1'], [
    { id: 'p1', name: 'Spring Concert', startDate: '2025-10-01', endDate: '2025-11-30' },
    { id: 'p2', name: 'Fall Show', startDate: '2025-09-01', endDate: '2025-10-31' },
  ]);
  renderPage(qc);
  const link = screen.getByRole('link', { name: 'Spring Concert' });
  expect(link).toHaveAttribute('href', '/projects/p1');
  expect(screen.getByRole('link', { name: 'Fall Show' })).toBeInTheDocument();
});

test('shows skeleton loader while projects are loading', () => {
  renderPage();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('shows inline error banner when query fails', async () => {
  server.use(http.get('/api/projects', () => HttpResponse.error()));
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Failed to load projects/i)).toBeInTheDocument();
  });
});

test('shows add-project-button for admin users', () => {
  setAuthUser(adminUser);
  const qc = createQueryClient();
  qc.setQueryData(['projects', 'py1'], []);
  renderPage(qc);
  expect(screen.getByTestId('add-project-button')).toBeInTheDocument();
});

test('does not show add-project-button for unauthenticated users', () => {
  const qc = createQueryClient();
  qc.setQueryData(['projects', 'py1'], []);
  renderPage(qc);
  expect(screen.queryByTestId('add-project-button')).not.toBeInTheDocument();
});

