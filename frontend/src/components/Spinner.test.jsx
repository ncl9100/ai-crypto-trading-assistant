import React from 'react';
import { render, screen } from '@testing-library/react';
import Spinner from './Spinner';

test('renders loading message', () => {
  render(<Spinner message="Loading data..." />);
  // Check if the loading message appears in the document
  expect(screen.getByText(/Loading data.../i)).toBeInTheDocument();
});