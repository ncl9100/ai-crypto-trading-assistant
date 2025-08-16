import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Predict from './Predict';
import { AuthProvider } from '../context/AuthContext';

// Basic smoke test
test('renders without crashing', () => {
  render(
    <AuthProvider>
      <Predict />
    </AuthProvider>
  );
});

// UI elements test
test('renders coin selection buttons and date picker', async () => {
  render(
    <AuthProvider>
      <Predict />
    </AuthProvider>
  );
  // Wait for spinner to disappear
  await waitFor(() => expect(screen.queryByText(/Loading prediction/i)).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: /BTC/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /ETH/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Select a date to predict/i)).toBeInTheDocument();
});

// Spinner test
test('shows loading spinner initially', () => {
  render(
    <AuthProvider>
      <Predict />
    </AuthProvider>
  );
  expect(screen.getByText(/Loading prediction/i)).toBeInTheDocument();
});