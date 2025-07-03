import React from 'react';
import { Line } from 'react-chartjs-2';

const minimalChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    x: { display: false, grid: { display: false } },
    y: { display: false, grid: { display: false } },
  },
  elements: {
    point: { radius: 0 },
  },
};

export default function MiniTrendChart({ data }) {
  return <Line data={data} options={minimalChartOptions} />;
} 