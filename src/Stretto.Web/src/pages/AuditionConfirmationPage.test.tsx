import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

function renderConfirmationPage(state?: { slotTime?: string; date?: string }) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/auditions/confirmation', state: state ?? null }]}
    >
      <Routes>
        <Route path="/auditions/confirmation" element={<AuditionConfirmationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

import AuditionConfirmationPage from './AuditionConfirmationPage';

test('renders "You\'re signed up!" heading', () => {
  renderConfirmationPage();
  expect(screen.getByRole('heading', { name: /you're signed up/i })).toBeInTheDocument();
});

test('renders "Please arrive a few minutes early" note', () => {
  renderConfirmationPage();
  expect(screen.getByText(/please arrive a few minutes early/i)).toBeInTheDocument();
});

test('renders formatted date and time when state is provided', () => {
  renderConfirmationPage({ slotTime: '10:30', date: '2025-11-15' });
  expect(screen.getByText(/november 15, 2025/i)).toBeInTheDocument();
  expect(screen.getByText(/10:30 am/i)).toBeInTheDocument();
});

test('does not render date/time summary when state is absent', () => {
  renderConfirmationPage();
  expect(screen.queryByText(/november/i)).not.toBeInTheDocument();
});
