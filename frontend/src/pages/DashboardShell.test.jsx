import React from 'react';
import { render } from '@testing-library/react';
import DashboardShell from './DashboardShell';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

test('renders children', () => {
  const { getByText } = render(
    <AuthProvider>
      <BrowserRouter>
        <DashboardShell>
          <div>Dashboard Content</div>
        </DashboardShell>
      </BrowserRouter>
    </AuthProvider>
  );
  expect(getByText(/Dashboard Content/i)).toBeInTheDocument();
});