import React from 'react';
import { render } from '@testing-library/react';
import Historical from './Historical';
import { AuthProvider } from '../context/AuthContext';

test('renders without crashing', () => {
  render(
    <AuthProvider>
      <Historical />
    </AuthProvider>
  );
});