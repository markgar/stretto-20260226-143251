import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import type { AuthUser } from '../stores/authStore';

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function wrapWithProviders(ui: React.ReactElement, queryClient: QueryClient): React.ReactElement {
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

export const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'Admin',
  orgId: 'org-1',
  orgName: 'Test Org',
};

export const memberUser: AuthUser = {
  id: 'member-1',
  email: 'member@example.com',
  firstName: 'Alice',
  lastName: 'Member',
  role: 'Member',
  orgId: 'org-1',
  orgName: 'Test Org',
};

export function setAuthUser(user: AuthUser | null): void {
  useAuthStore.setState({ user });
}
