import React from 'react';
import { render } from '@testing-library/react';
import Sentiment from './Sentiment';
import { AuthProvider } from '../context/AuthContext';

test('renders without crashing', () => {
  render(
    <AuthProvider>
      <Sentiment />
    </AuthProvider>
  );
});