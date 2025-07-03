import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helper to round to a nice value
function niceRound(value, roundTo) {
  return Math.round(value / roundTo) * roundTo;
}

// Helper to get nice min/max and stepSize for y-axis
function getEvenYAxisRange(dataArr, numTicks = 7, roundTo = 100) {
  const min = Math.min(...dataArr);
  const max = Math.max(...dataArr);
  const buffer = (max - min) * 0.1 || 1;
  let niceMin = Math.floor((min - buffer) / roundTo) * roundTo;
  let niceMax = Math.ceil((max + buffer) / roundTo) * roundTo;
  // Ensure min and max are not equal
  if (niceMin === niceMax) niceMax = niceMin + roundTo * (numTicks - 1);
  const stepSize = (niceMax - niceMin) / (numTicks - 1);
  return { min: niceMin, max: niceMax, stepSize };
}

const getYAxisRange = (dataArr) => {
  const min = Math.min(...dataArr);
  const max = Math.max(...dataArr);
  const buffer = (max - min) * 0.1 || 1; // 10% buffer or 1 if flat
  return {
    min: min - buffer,
    max: max + buffer,
  };
};

const Predict = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('BTC');

  useEffect(() => {
    axios.get('http://localhost:5000/predict')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div>Loading...</div>;

  // Prepare labels: use dates from backend, format as 'MMM D'
  const btcDates = Array.isArray(data.BTC?.dates) ? data.BTC.dates : [];
  const ethDates = Array.isArray(data.ETH?.dates) ? data.ETH.dates : [];
  const btcLabels = btcDates.map((date, idx) => {
    if (idx === btcDates.length - 1) return 'Next Day';
    return format(parseISO(date), 'MMM d');
  });
  const ethLabels = ethDates.map((date, idx) => {
    if (idx === ethDates.length - 1) return 'Next Day';
    return format(parseISO(date), 'MMM d');
  });

  // BTC chart data
  const btcHistory = Array.isArray(data.BTC?.history) ? data.BTC.history : [];
  const btcPrediction = typeof data.BTC?.predicted_price === 'number' ? data.BTC?.predicted_price : null;
  const btcDataArr = btcPrediction !== null ? [...btcHistory, btcPrediction] : btcHistory;
  const btcPointBackgroundColors = Array(Math.max(0, btcDataArr.length - 1)).fill('#f7931a');
  btcPointBackgroundColors.push('#ff0000');
  const btcPointRadius = Array(Math.max(0, btcDataArr.length - 1)).fill(3);
  btcPointRadius.push(10);
  const btcPointStyle = Array(Math.max(0, btcDataArr.length - 1)).fill('circle');
  btcPointStyle.push('triangle');
  const btcYAxisObj = getEvenYAxisRange(btcDataArr, 7, 1000); // 7 ticks, round to 1000 for BTC
  const btcYAxis = { min: btcYAxisObj.min, max: btcYAxisObj.max };

  const btcChartData = {
    labels: btcLabels,
    datasets: [
      {
        label: 'BTC Price (USD)',
        data: btcDataArr,
        borderColor: '#f7931a',
        backgroundColor: '#f7931a33',
        tension: 0.2,
        pointBackgroundColor: btcPointBackgroundColors,
        pointRadius: btcPointRadius,
        pointHoverRadius: btcPointRadius,
        pointStyle: btcPointStyle,
        clip: false,
      },
    ],
  };

  const btcOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          font: {
            size: 20,
          },
          color: '#fff',
        },
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const item = tooltipItems[0];
            if (item.dataIndex === btcDataArr.length - 1) {
              return 'Prediction';
            }
            return item.label;
          },
        },
      },
    },
    layout: {
      padding: {
        right: 30,
        left: 30,
      },
    },
    scales: {
      y: {
        ...btcYAxis,
        title: {
          display: true,
          text: 'USD',
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: 18,
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        ticks: {
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: 18,
          },
          padding: 10,
          color: '#fff',
          callback: function(value) {
            return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          },
          stepSize: btcYAxisObj.stepSize,
        },
        // Note: True axis breaks (zig-zags) are not natively supported in Chart.js
      },
      x: {
        title: {
          display: true,
          text: 'Day',
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: 18,
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        ticks: {
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: 18,
          },
          padding: 10,
          color: '#fff',
        },
      },
    },
  };

  // ETH chart data
  const ethHistory = Array.isArray(data.ETH?.history) ? data.ETH.history : [];
  const ethPrediction = typeof data.ETH?.predicted_price === 'number' ? data.ETH?.predicted_price : null;
  const ethDataArr = ethPrediction !== null ? [...ethHistory, ethPrediction] : ethHistory;
  const ethPointBackgroundColors = Array(Math.max(0, ethDataArr.length - 1)).fill('#627eea');
  ethPointBackgroundColors.push('#00ffea');
  const ethPointRadius = Array(Math.max(0, ethDataArr.length - 1)).fill(3);
  ethPointRadius.push(10);
  const ethPointStyle = Array(Math.max(0, ethDataArr.length - 1)).fill('circle');
  ethPointStyle.push('rectRot');
  const ethYAxisObj = getEvenYAxisRange(ethDataArr, 7, 100); // 7 ticks, round to 100 for ETH
  const ethYAxis = { min: ethYAxisObj.min, max: ethYAxisObj.max };

  const ethChartData = {
    labels: ethLabels,
    datasets: [
      {
        label: 'ETH Price (USD)',
        data: ethDataArr,
        borderColor: '#627eea',
        backgroundColor: '#627eea33',
        tension: 0.2,
        pointBackgroundColor: ethPointBackgroundColors,
        pointRadius: ethPointRadius,
        pointHoverRadius: ethPointRadius,
        pointStyle: ethPointStyle,
        clip: false,
      },
    ],
  };

  const ethOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          font: {
            size: 20,
          },
          color: '#fff',
        },
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const item = tooltipItems[0];
            if (item.dataIndex === ethDataArr.length - 1) {
              return 'Prediction';
            }
            return item.label;
          },
        },
      },
    },
    layout: {
      padding: {
        right: 30,
        left: 30,
      },
    },
    scales: {
      y: {
        ...ethYAxis,
        title: {
          display: true,
          text: 'USD',
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: 18,
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        ticks: {
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: 18,
          },
          padding: 10,
          color: '#fff',
          callback: function(value) {
            return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          },
          stepSize: ethYAxisObj.stepSize,
        },
        // Note: True axis breaks (zig-zags) are not natively supported in Chart.js
      },
      x: {
        title: {
          display: true,
          text: 'Day',
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: 18,
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        ticks: {
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: 18,
          },
          padding: 10,
          color: '#fff',
        },
      },
    },
  };

  return (
    <div className="flex justify-center">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100 mx-auto max-w-3xl">
        <h2 className="text-3xl font-semibold text-center mb-8">Price Trend & Next-Day Prediction</h2>
        <div className="flex justify-center mb-6">
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors duration-200 ${activeTab === 'BTC' ? 'bg-slate-700 text-amber-400' : 'bg-slate-900 text-slate-300'}`}
            onClick={() => setActiveTab('BTC')}
          >
            BTC
          </button>
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors duration-200 ${activeTab === 'ETH' ? 'bg-slate-700 text-blue-400' : 'bg-slate-900 text-slate-300'}`}
            onClick={() => setActiveTab('ETH')}
          >
            ETH
          </button>
        </div>
        <div>
          {activeTab === 'BTC' ? (
            <Line data={btcChartData} options={btcOptions} />
          ) : (
            <Line data={ethChartData} options={ethOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Predict;
