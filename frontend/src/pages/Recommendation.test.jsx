import React from 'react';
import { render } from '@testing-library/react';
import Recommendation from './Recommendation';
import { AuthProvider } from '../context/AuthContext';

test('renders without crashing', () => {
  render(
    <AuthProvider>
      <Recommendation />
    </AuthProvider>
  );
});