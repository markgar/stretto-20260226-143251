import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, setAuthUser } from '../mocks/testUtils';

import ProjectDetailPage from './ProjectDetailPage';

const sampleProject = {
  id: 'p1',
  name: 'Spring Concert',
  startDate: '2025-10-01',
  endDate: '2025-11-30',
  programYearId: 'py1',
};

function renderPage(queryClient = createQueryClient(), id = 'p1') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/${id}`]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/edit" element={<div data-testid="project-form">Edit Form</div>} />
          <Route path="/program-years/:id" element={<div data-testid="program-years-detail">PY Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setAuthUser(null));
afterEach(() => setAuthUser(null));

test('renders project name as heading when data loads', () => {
  const qc = createQueryClient();
  qc.setQueryData(['project', 'p1'], sampleProject);
  renderPage(qc);
  expect(screen.getByRole('heading', { name: 'Spring Concert' })).toBeInTheDocument();
});

test('renders Overview, Events, Members, Materials tabs', () => {
  const qc = createQueryClient();
  qc.setQueryData(['project', 'p1'], sampleProject);
  renderPage(qc);
  expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
  expect(screen.getByTestId('tab-events')).toBeInTheDocument();
  expect(screen.getByTestId('tab-members')).toBeInTheDocument();
  expect(screen.getByTestId('tab-materials')).toBeInTheDocument();
});

test('clicking Events tab renders events content', async () => {
  const qc = createQueryClient();
  qc.setQueryData(['project', 'p1'], sampleProject);
  qc.setQueryData(['events', 'p1'], []);
  renderPage(qc);
  await userEvent.click(screen.getByTestId('tab-events'));
  expect(screen.getByText(/No events scheduled yet/i)).toBeInTheDocument();
});

test('shows skeleton loader while project is loading', () => {
  renderPage();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('shows inline error when project fetch fails', async () => {
  server.use(http.get('/api/projects/:id', () => HttpResponse.error()));
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Failed to load project/i)).toBeInTheDocument();
  });
});

test('clicking Members tab renders ProjectMembersTab with search input', async () => {
  const qc = createQueryClient();
  qc.setQueryData(['project', 'p1'], sampleProject);
  qc.setQueryData(['projectMembers', 'p1'], []);
  renderPage(qc);
  await userEvent.click(screen.getByTestId('tab-members'));
  expect(screen.getByTestId('member-search-input')).toBeInTheDocument();
});

test('clicking Members tab no longer shows "Coming soon" placeholder', async () => {
  const qc = createQueryClient();
  qc.setQueryData(['project', 'p1'], sampleProject);
  qc.setQueryData(['projectMembers', 'p1'], []);
  renderPage(qc);
  await userEvent.click(screen.getByTestId('tab-members'));
  expect(screen.queryByText(/Coming soon/i)).not.toBeInTheDocument();
});

test('clicking Materials tab renders ProjectMaterialsTab, not "Coming soon"', async () => {
  const qc = createQueryClient();
  qc.setQueryData(['project', 'p1'], sampleProject);
  qc.setQueryData(['projectLinks', 'p1'], []);
  qc.setQueryData(['projectDocuments', 'p1'], []);
  renderPage(qc);
  await userEvent.click(screen.getByTestId('tab-materials'));
  expect(screen.queryByText(/Coming soon/i)).not.toBeInTheDocument();
});

test('clicking Materials tab renders Links and Documents section headings', async () => {
  const qc = createQueryClient();
  qc.setQueryData(['project', 'p1'], sampleProject);
  qc.setQueryData(['projectLinks', 'p1'], []);
  qc.setQueryData(['projectDocuments', 'p1'], []);
  renderPage(qc);
  await userEvent.click(screen.getByTestId('tab-materials'));
  expect(screen.getByText('Links')).toBeInTheDocument();
  expect(screen.getByText('Documents')).toBeInTheDocument();
});
