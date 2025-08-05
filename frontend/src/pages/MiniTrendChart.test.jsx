import React from 'react';
import { render } from '@testing-library/react';
import MiniTrendChart from './MiniTrendChart';

test('renders without crashing', () => {
  render(<MiniTrendChart data={{ labels: [], datasets: [] }} />);
});