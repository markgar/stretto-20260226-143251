import { vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('../api/generated/services/ProjectMaterialsService', () => ({
  ProjectMaterialsService: {
    getApiProjectsLinks: vi.fn(),
    postApiProjectsLinks: vi.fn(),
    deleteApiProjectsLinks: vi.fn(),
    getApiProjectsDocuments: vi.fn(),
    postApiProjectsDocuments: vi.fn(),
    deleteApiProjectsDocuments: vi.fn(),
  },
}));

const mockWindowConfirm = vi.fn(() => true);
Object.defineProperty(window, 'confirm', { value: mockWindowConfirm, writable: true });

import ProjectMaterialsTab from './ProjectMaterialsTab';
import { setAuthUser, adminUser, memberUser } from '../mocks/testUtils';

const sampleLinks = [
  { id: 'l1', title: 'Sheet Music', url: 'https://example.com/sheet' },
  { id: 'l2', title: 'Recording', url: 'https://example.com/rec' },
];
const sampleDocuments = [
  { id: 'd1', title: 'Score PDF', fileName: 'score.pdf' },
  { id: 'd2', title: 'Program', fileName: 'program.pdf' },
];

function renderTab(projectId = 'p1') {
  return render(<ProjectMaterialsTab projectId={projectId} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuthUser(adminUser);
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseQuery
    .mockReturnValueOnce({ data: sampleLinks, isLoading: false, isError: false })
    .mockReturnValueOnce({ data: sampleDocuments, isLoading: false, isError: false });
});

// --- Links section (admin) ---

test('renders add-link form inputs and button for admin', () => {
  renderTab();
  expect(screen.getByTestId('link-title-input')).toBeInTheDocument();
  expect(screen.getByTestId('link-url-input')).toBeInTheDocument();
  expect(screen.getByTestId('add-link-button')).toBeInTheDocument();
});

test('renders each link as an anchor with correct data-testid', () => {
  renderTab();
  const l1 = screen.getByTestId('link-l1');
  expect(l1).toBeInTheDocument();
  expect(l1).toHaveAttribute('href', 'https://example.com/sheet');
  expect(l1).toHaveTextContent('Sheet Music');
  expect(screen.getByTestId('link-l2')).toBeInTheDocument();
});

test('renders delete-link buttons for admin', () => {
  renderTab();
  expect(screen.getByTestId('delete-link-l1')).toBeInTheDocument();
  expect(screen.getByTestId('delete-link-l2')).toBeInTheDocument();
});

test('calls delete link mutation when delete button is clicked and confirmed', async () => {
  const mutate = vi.fn();
  mockUseMutation.mockReturnValue({ mutate, isPending: false });
  mockWindowConfirm.mockReturnValue(true);
  renderTab();
  await userEvent.click(screen.getByTestId('delete-link-l1'));
  expect(mutate).toHaveBeenCalledWith('l1');
});

test('does not call delete link mutation when user cancels confirm dialog', async () => {
  const mutate = vi.fn();
  mockUseMutation.mockReturnValue({ mutate, isPending: false });
  mockWindowConfirm.mockReturnValue(false);
  renderTab();
  await userEvent.click(screen.getByTestId('delete-link-l1'));
  expect(mutate).not.toHaveBeenCalled();
});

test('shows "No links yet" empty state when links list is empty', () => {
  mockUseQuery
    .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
    .mockReturnValueOnce({ data: [], isLoading: false, isError: false });
  renderTab();
  expect(screen.getByText('No links yet')).toBeInTheDocument();
});

test('shows links loading skeleton while links are loading', () => {
  mockUseQuery
    .mockReturnValueOnce({ data: [], isLoading: true, isError: false })
    .mockReturnValueOnce({ data: [], isLoading: false, isError: false });
  renderTab();
  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('shows error message when link mutation fails', () => {
  let errorCallback: (() => void) | undefined;
  mockUseMutation.mockImplementation(({ onError }: { onError: () => void }) => {
    errorCallback = onError;
    return { mutate: vi.fn(), isPending: false };
  });
  renderTab();
  act(() => { errorCallback?.(); });
  expect(screen.getByText(/Failed to/i)).toBeInTheDocument();
});

// --- Documents section (admin) ---

test('renders upload-document input, title input, and button for admin', () => {
  renderTab();
  expect(screen.getByTestId('upload-document-input')).toBeInTheDocument();
  expect(screen.getByTestId('upload-document-title-input')).toBeInTheDocument();
  expect(screen.getByTestId('upload-document-button')).toBeInTheDocument();
});

test('renders each document with title and download anchor', () => {
  renderTab();
  expect(screen.getByText('Score PDF')).toBeInTheDocument();
  const dl1 = screen.getByTestId('download-document-d1');
  expect(dl1).toHaveAttribute('href', '/api/projects/p1/documents/d1/download');
  expect(dl1).toHaveAttribute('download', 'score.pdf');
});

test('renders delete-document buttons for admin', () => {
  renderTab();
  expect(screen.getByTestId('delete-document-d1')).toBeInTheDocument();
  expect(screen.getByTestId('delete-document-d2')).toBeInTheDocument();
});

test('calls delete document mutation when delete button is clicked and confirmed', async () => {
  const mutate = vi.fn();
  mockUseMutation.mockReturnValue({ mutate, isPending: false });
  mockWindowConfirm.mockReturnValue(true);
  renderTab();
  await userEvent.click(screen.getByTestId('delete-document-d1'));
  expect(mutate).toHaveBeenCalledWith('d1');
});

test('shows "No documents yet" empty state when documents list is empty', () => {
  mockUseQuery
    .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
    .mockReturnValueOnce({ data: [], isLoading: false, isError: false });
  renderTab();
  expect(screen.getByText('No documents yet')).toBeInTheDocument();
});

// --- Member (non-admin) view ---

test('does not render add-link form for member user', () => {
  setAuthUser(memberUser);
  renderTab();
  expect(screen.queryByTestId('link-title-input')).not.toBeInTheDocument();
  expect(screen.queryByTestId('add-link-button')).not.toBeInTheDocument();
});

test('does not render delete-link buttons for member user', () => {
  setAuthUser(memberUser);
  renderTab();
  expect(screen.queryByTestId('delete-link-l1')).not.toBeInTheDocument();
  expect(screen.queryByTestId('delete-link-l2')).not.toBeInTheDocument();
});

test('does not render upload-document form for member user', () => {
  setAuthUser(memberUser);
  renderTab();
  expect(screen.queryByTestId('upload-document-button')).not.toBeInTheDocument();
  expect(screen.queryByTestId('upload-document-input')).not.toBeInTheDocument();
});

test('does not render delete-document buttons for member user', () => {
  setAuthUser(memberUser);
  renderTab();
  expect(screen.queryByTestId('delete-document-d1')).not.toBeInTheDocument();
});

test('renders download anchors for member user', () => {
  setAuthUser(memberUser);
  renderTab();
  expect(screen.getByTestId('download-document-d1')).toBeInTheDocument();
  expect(screen.getByTestId('download-document-d2')).toBeInTheDocument();
});

test('renders link anchors for member user', () => {
  setAuthUser(memberUser);
  renderTab();
  expect(screen.getByTestId('link-l1')).toBeInTheDocument();
  expect(screen.getByTestId('link-l2')).toBeInTheDocument();
});
