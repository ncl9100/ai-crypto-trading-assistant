import React from 'react';
import { render } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

test('renders login form', () => {
  const { getByText } = render(
    <AuthProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthProvider>
  );
  expect(getByText(/Sign in to your account/i)).toBeInTheDocument();
});