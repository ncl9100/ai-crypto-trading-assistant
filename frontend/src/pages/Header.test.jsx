import React from 'react';
import { render } from '@testing-library/react';
import Header from './Header';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

test('renders navigation links', () => {
  const { getByText } = render(
    <AuthProvider>
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    </AuthProvider>
  );
  expect(getByText(/Home/i)).toBeInTheDocument();
});