import React from 'react';
import { render } from '@testing-library/react';
import AverageSentimentCard from './AverageSentimentCard';
import { AuthProvider } from '../context/AuthContext';

test('renders without crashing', () => {
  render(
    <AuthProvider>
      <AverageSentimentCard />
    </AuthProvider>
  );
});