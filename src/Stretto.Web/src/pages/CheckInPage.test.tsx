import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../mocks/testUtils';

import CheckInPage from './CheckInPage';

function renderPage(eventId = 'event-abc') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[`/checkin/${eventId}`]}>
        <Routes>
          <Route path="/checkin/:eventId" element={<CheckInPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

test('renders checkin-button with data-testid', () => {
  renderPage();
  expect(screen.getByTestId('checkin-button')).toBeInTheDocument();
});

test('renders "Check In" heading', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'Check In' })).toBeInTheDocument();
});

test('renders button labeled "I\'m here"', () => {
  renderPage();
  expect(screen.getByTestId('checkin-button')).toHaveTextContent("I'm here");
});

test('shows checkin-success message after successful check-in', async () => {
  server.use(
    http.post('/api/checkin/:eventId', () => HttpResponse.json({}, { status: 200 })),
  );
  renderPage();
  fireEvent.click(screen.getByTestId('checkin-button'));
  await waitFor(() => {
    expect(screen.getByTestId('checkin-success')).toBeInTheDocument();
  });
  expect(screen.getByTestId('checkin-success')).toHaveTextContent("You're checked in!");
});

test('hides checkin-button after successful check-in', async () => {
  server.use(
    http.post('/api/checkin/:eventId', () => HttpResponse.json({}, { status: 200 })),
  );
  renderPage();
  fireEvent.click(screen.getByTestId('checkin-button'));
  await waitFor(() => {
    expect(screen.queryByTestId('checkin-button')).not.toBeInTheDocument();
  });
});

test('shows error message after failed check-in', async () => {
  server.use(
    http.post('/api/checkin/:eventId', () => HttpResponse.error()),
  );
  renderPage();
  fireEvent.click(screen.getByTestId('checkin-button'));
  await waitFor(() => {
    expect(screen.getByText(/Check-in failed/i)).toBeInTheDocument();
  });
});
