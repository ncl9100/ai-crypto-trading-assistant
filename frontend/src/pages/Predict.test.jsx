import React from 'react';
import { render } from '@testing-library/react';
import Predict from './Predict';
import { AuthProvider } from '../context/AuthContext';

test('renders without crashing', () => {
  render(
    <AuthProvider>
      <Predict />
    </AuthProvider>
  );
});