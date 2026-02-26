import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock fetch so AuthInitializer does not throw on validate
global.fetch = vi.fn().mockResolvedValue({ ok: false });

test('root route redirects to login and renders sign-in heading', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});

test('does not render sign-in heading on unknown route', () => {
  render(
    <MemoryRouter initialEntries={['/unknown-path']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('heading', { name: /sign in/i })).not.toBeInTheDocument();
});

test('renders only one heading on the root route', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
  const headings = screen.getAllByRole('heading');
  expect(headings).toHaveLength(1);
});
