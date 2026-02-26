import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders Stretto heading', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'Stretto' })).toBeInTheDocument();
});

test('does not render Stretto heading on unknown route', () => {
  render(
    <MemoryRouter initialEntries={['/unknown-path']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('heading', { name: 'Stretto' })).not.toBeInTheDocument();
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
