import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock zustand before importing components that use it
vi.mock('zustand', () => ({
  create: (fn: (set: (state: object) => void) => object) => {
    // Return a hook that returns the store state directly
    let state = fn((partial: object) => {
      Object.assign(state, partial);
    });
    const useStore = (selector?: (s: object) => unknown) =>
      selector ? selector(state) : state;
    useStore.getState = () => state;
    return useStore;
  },
}));

import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../stores/authStore';

const mockAdminUser = {
  id: '1',
  email: 'admin@stretto.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'Admin' as const,
  orgId: 'org1',
  orgName: 'Stretto Orchestra',
};

test('unauthenticated user is redirected to /login', () => {
  useAuthStore.getState().clearUser();
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('Login Page')).toBeInTheDocument();
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
});

test('authenticated user can access protected route', () => {
  useAuthStore.getState().setUser(mockAdminUser);
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});

test('member user is redirected to /dashboard when admin role required', () => {
  useAuthStore.getState().setUser({ ...mockAdminUser, role: 'Member' });
  render(
    <MemoryRouter initialEntries={['/admin-required']}>
      <Routes>
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route element={<ProtectedRoute requiredRole="Admin" />}>
          <Route path="/admin-required" element={<div>Admin Only</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
});

test('admin user can access admin-required route', () => {
  useAuthStore.getState().setUser(mockAdminUser);
  render(
    <MemoryRouter initialEntries={['/admin-required']}>
      <Routes>
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route element={<ProtectedRoute requiredRole="Admin" />}>
          <Route path="/admin-required" element={<div>Admin Only</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('Admin Only')).toBeInTheDocument();
});
