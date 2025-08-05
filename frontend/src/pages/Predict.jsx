import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-toastify'; // <-- ADD THIS
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

const Predict = () => {
  // 1. Detect mobile
  const isMobile = window.innerWidth < 640;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('BTC'); // <-- FIXED: define activeTab state
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    setLoading(true);
    const headers = getAuthHeaders();
    axios.get('http://localhost:5000/predict', { headers })
      .then(res => {
        setData(res.data);
        setError(null);
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to load prediction data';
        setError(msg);
        toast.error(msg); // <-- ADD THIS
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [getAuthHeaders]);

  if (loading) return <Spinner message="Loading prediction..." />;
  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!data) return <Spinner message="Loading prediction..." />;

  // Prepare labels: use dates from backend, format as 'MMM D'
  const btcDates = Array.isArray(data.BTC?.dates) ? data.BTC.dates : [];
  const ethDates = Array.isArray(data.ETH?.dates) ? data.ETH.dates : [];
  const btcLabels = btcDates.map((date, idx) => {
    if (idx === btcDates.length - 1) return 'Next Day';
    return isMobile
      ? format(parseISO(date), 'MM/dd')
      : format(parseISO(date), 'MMM d');
  });
  const ethLabels = ethDates.map((date, idx) => {
    if (idx === ethDates.length - 1) return 'Next Day';
    return format(parseISO(date), 'MMM d');
  });

  // BTC chart data
  const btcHistory = Array.isArray(data.BTC?.history) ? data.BTC.history : [];
  const btcPrediction = typeof data.BTC?.predicted_price === 'number' ? data.BTC?.predicted_price : null;

  // 1. Detect mobile
  const isMobileBTC = window.innerWidth < 640;

  // 2. Slice data for mobile
  const mobileSliceBTC = 7; // show last 7 points + prediction
  const btcHistorySlice = isMobileBTC ? btcHistory.slice(-mobileSliceBTC) : btcHistory;
  const btcDataArr = btcPrediction !== null
    ? [...btcHistorySlice, btcPrediction]
    : btcHistorySlice;
  // FIX: Only slice the last N+1 labels to match data length (no concat)
  const btcLabelsSlice = isMobileBTC
    ? btcLabels.slice(-btcDataArr.length)
    : btcLabels;

  // 3. Point sizes
  const btcPointRadius = Array(Math.max(0, btcDataArr.length - 1)).fill(isMobileBTC ? 7 : 3);
  btcPointRadius.push(isMobileBTC ? 14 : 10);
  const btcPointHoverRadius = btcPointRadius;

  // Set all points to 'circle', last (prediction) to 'triangle'
  const btcPointStyle = Array(Math.max(0, btcDataArr.length - 1)).fill('circle');
  btcPointStyle.push('triangle');

  // Set all points to orange, last (prediction) to red
  const btcPointBackgroundColors = Array(Math.max(0, btcDataArr.length - 1)).fill('#f7931a');
  btcPointBackgroundColors.push('#ff3b3b'); // prediction point in red

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
        pointHoverRadius: btcPointHoverRadius,
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
          padding: isMobile ? 24 : 10, // more space below legend on mobile
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
            size: isMobile ? 12 : 18, // match tick font size
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        grid: {
          color: '#334155',
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: isMobile ? 12 : 18, // match x-axis
          },
          padding: 10,
          color: '#fff',
          callback: function(value) {
            return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          },
          stepSize: btcYAxisObj.stepSize,
          maxTicksLimit: 7,
          minTicksLimit: 4,
        },
      },
      x: {
        grid: {
          color: '#334155',
          drawOnChartArea: true,
          drawTicks: true,
        },
        title: {
          display: true,
          text: 'Day',
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: isMobile ? 12 : 18, // match y-axis
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        ticks: {
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: isMobile ? 12 : 18, // match y-axis
          },
          padding: 6,
          color: '#fff',
          maxTicksLimit: isMobile ? 3 : 7,
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
  };

  // ETH chart data
  const ethHistory = Array.isArray(data.ETH?.history) ? data.ETH.history : [];
  const ethPrediction = typeof data.ETH?.predicted_price === 'number' ? data.ETH?.predicted_price : null;

  // 1. Detect mobile
  const isMobileETH = window.innerWidth < 640;

  // 2. Slice data for mobile
  const mobileSliceETH = 7; // show last 7 points + prediction
  const ethHistorySlice = isMobileETH ? ethHistory.slice(-mobileSliceETH) : ethHistory;
  const ethDataArr = ethPrediction !== null ? [...ethHistorySlice, ethPrediction] : ethHistorySlice;
  // FIX: Only slice the last N+1 labels to match data length (no concat)
  const ethLabelsSlice = isMobileETH
    ? ethLabels.slice(-ethDataArr.length)
    : ethLabels;

  // 3. Point sizes
  const ethPointRadius = Array(Math.max(0, ethDataArr.length - 1)).fill(isMobileETH ? 7 : 3);
  ethPointRadius.push(isMobileETH ? 14 : 10);
  const ethPointHoverRadius = ethPointRadius;

  // Set all points to 'circle', last (prediction) to 'triangle'
  const ethPointStyle = Array(Math.max(0, ethDataArr.length - 1)).fill('circle');
  ethPointStyle.push('triangle');

  // Set all points to blue, last (prediction) to red
  const ethPointBackgroundColors = Array(Math.max(0, ethDataArr.length - 1)).fill('#627eea');
  ethPointBackgroundColors.push('#ff3b3b'); // prediction point in red

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
          padding: isMobile ? 24 : 10, // match BTC: more space below legend on mobile
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
            size: isMobile ? 12 : 18, // match BTC: smaller on mobile
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        grid: {
          color: '#334155',
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: isMobile ? 12 : 18, // match BTC: smaller on mobile
          },
          padding: 10,
          color: '#fff',
          callback: function(value) {
            return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          },
          stepSize: ethYAxisObj.stepSize,
          maxTicksLimit: 7,
          minTicksLimit: 4,
        },
      },
      x: {
        grid: {
          color: '#334155',
          drawOnChartArea: true,
          drawTicks: true,
        },
        title: {
          display: true,
          text: 'Day',
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: isMobile ? 12 : 18, // match BTC: smaller on mobile
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        ticks: {
          align: 'center',
          font: {
            family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            size: isMobile ? 12 : 18, // match BTC: smaller on mobile
          },
          padding: 6,
          color: '#fff',
          maxTicksLimit: isMobile ? 3 : 7,
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
  };

  return (
    <div className="flex justify-center">
      <div className="bg-slate-800 rounded-xl shadow-lg p-2 sm:p-6 w-full text-center text-slate-100 mx-auto max-w-full sm:max-w-3xl">
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
        <div className={`min-h-[350px] sm:min-h-[350px]`}>
          {activeTab === 'BTC' ? (
            <Line
              data={{
                ...btcChartData,
                labels: isMobileBTC ? btcLabelsSlice : btcLabels,
                datasets: [
                  {
                    ...btcChartData.datasets[0],
                    data: btcDataArr,
                    pointRadius: btcPointRadius,
                    pointHoverRadius: btcPointHoverRadius,
                  },
                ],
              }}
              options={btcOptions}
            />
          ) : (
            <Line
              data={{
                ...ethChartData,
                labels: isMobileETH ? ethLabelsSlice : ethLabels,
                datasets: [
                  {
                    ...ethChartData.datasets[0],
                    data: ethDataArr,
                    pointRadius: ethPointRadius,
                    pointHoverRadius: ethPointHoverRadius,
                  },
                ],
              }}
              options={ethOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Predict;
