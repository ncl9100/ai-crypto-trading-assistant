import React from 'react';
import { Line } from 'react-chartjs-2';
import Spinner from '../components/Spinner';

const getChartData = (actual, predicted, coin) => {
  const colorActual = coin === 'BTC' ? '#FFA500' : '#0074D9';
  const colorPred = coin === 'BTC' ? '#00BFFF' : '#2ECC40';
  // Get all unique dates from both actual and predicted
  const allDatesSet = new Set([
    ...actual.map(d => d.date),
    ...predicted.map(d => d.date)
  ]);
  const labels = Array.from(allDatesSet);
  // Map actual and predicted to the full label set
  const actualMap = Object.fromEntries(actual.map(d => [d.date, d.price]));
  const predictedMap = Object.fromEntries(predicted.map(d => [d.date, d.price]));
  return {
    labels,
    datasets: [
      {
        label: 'Actual',
        data: labels.map(date => actualMap[date] ?? null),
        borderColor: colorActual,
        backgroundColor: colorActual + '33',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Predicted',
        data: labels.map(date => predictedMap[date] ?? null),
        borderColor: colorPred,
        backgroundColor: colorPred + '33',
        borderWidth: 2,
        pointRadius: 0,
        borderDash: [6, 6],
        fill: false,
        tension: 0.2,
      },
    ],
  };
};

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

export default function MiniTrendChart({ actual = [], predicted = [], coin = 'BTC', loading }) {
  if (loading) return <Spinner message="Loading chart..." />;
  const safeActual = Array.isArray(actual) ? actual : [];
  const safePredicted = Array.isArray(predicted) ? predicted : [];
  const chartData = getChartData(safeActual, safePredicted, coin);
  const isEmpty = (!safeActual || safeActual.length === 0) && (!safePredicted || safePredicted.length === 0);
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-slate-400 italic mb-2">No chart data available</div>
        <pre style={{ fontSize: 12, color: '#888', background: '#222', padding: 8, borderRadius: 6, maxWidth: 320, overflowX: 'auto' }}>
          actual: {JSON.stringify(safeActual, null, 2)}
          predicted: {JSON.stringify(safePredicted, null, 2)}
        </pre>
      </div>
    );
  }
  return <Line data={chartData} options={minimalChartOptions} />;
}