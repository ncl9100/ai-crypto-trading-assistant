import React from 'react';
import { render } from '@testing-library/react';
import Price from './Price';
import { AuthProvider } from '../context/AuthContext';

test('renders without crashing', () => {
  render(
    <AuthProvider>
      <Price />
    </AuthProvider>
  );
});