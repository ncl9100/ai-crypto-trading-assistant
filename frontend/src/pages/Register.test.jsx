import React from 'react';
import { render } from '@testing-library/react';
import Register from './Register';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

test('renders register form', () => {
  const { getByText } = render(
    <AuthProvider>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </AuthProvider>
  );
  expect(getByText(/Create your account/i)).toBeInTheDocument();
});