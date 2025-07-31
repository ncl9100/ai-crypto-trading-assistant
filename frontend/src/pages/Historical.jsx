import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Historical = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('BTC');
  const [timeframe, setTimeframe] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getAuthHeaders } = useAuth();

  const fetchHistoricalData = (selectedTimeframe) => {
    setIsLoading(true);
    setError(null);
    
    axios.get(`http://localhost:5000/historical?timeframe=${selectedTimeframe}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        console.log('Historical API response:', res.data);
        setData(res.data);
      })
      .catch(err => {
        console.error('Historical API error:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to load historical data');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchHistoricalData(timeframe);
  }, [getAuthHeaders, timeframe]);

  if (isLoading) return <div className="text-slate-400 italic">Loading historical data...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!data) return <div className="text-slate-400 italic">No data available</div>;

  // Get data for active tab
  const activeData = data[activeTab];
  if (!activeData || activeData.error) {
    return <div className="text-red-400">Error loading {activeTab} data: {activeData?.error || 'Unknown error'}</div>;
  }

  // Sample data based on timeframe to prevent overcrowding
  const sampleData = (dates, prices, timeframe) => {
    const totalPoints = dates.length;
    let step = 1;
    
    if (timeframe === '7d') {
      step = 1; // Show all points for 7 days
    } else if (timeframe === '30d') {
      step = Math.max(1, Math.floor(totalPoints / 15)); // Max 15 points
    } else if (timeframe === '6m') {
      step = Math.max(1, Math.floor(totalPoints / 20)); // Max 20 points
    } else if (timeframe === '1y') {
      step = Math.max(1, Math.floor(totalPoints / 25)); // Max 25 points
    }
    
    const sampledDates = [];
    const sampledPrices = [];
    
    for (let i = 0; i < totalPoints; i += step) {
      sampledDates.push(dates[i]);
      sampledPrices.push(prices[i]);
    }
    
    // Always include the last point
    if (sampledDates[sampledDates.length - 1] !== dates[dates.length - 1]) {
      sampledDates.push(dates[dates.length - 1]);
      sampledPrices.push(prices[prices.length - 1]);
    }
    
    return { sampledDates, sampledPrices };
  };

  const { sampledDates, sampledPrices } = sampleData(activeData.dates, activeData.prices, timeframe);

  // Prepare chart data
  const labels = sampledDates.map((date, idx) => {
    if (idx === 0) return `${timeframe === '7d' ? '7 days ago' : timeframe === '30d' ? '30 days ago' : timeframe === '6m' ? '6 months ago' : '1 year ago'}`;
    if (idx === sampledDates.length - 1) return 'Today';
    return format(parseISO(date), 'MMM d');
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `${activeTab} Price (USD)`,
        data: sampledPrices,
        borderColor: activeTab === 'BTC' ? '#f7931a' : '#627eea',
        backgroundColor: activeTab === 'BTC' ? '#f7931a33' : '#627eea33',
        tension: 0.1,
        pointRadius: timeframe === '7d' ? 4 : timeframe === '30d' ? 3 : 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          font: { size: 14 },
          color: '#fff',
          usePointStyle: true,
          pointStyle: 'circle'
        },
      },
      title: { 
        display: true,
        text: `${activeTab} ${timeframe === '7d' ? '7-Day' : timeframe === '30d' ? '30-Day' : timeframe === '6m' ? '6-Month' : '1-Year'} Price History`,
        color: '#fff',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#fff',
          font: { size: 12 }
        },
        ticks: { 
          color: '#fff',
          maxTicksLimit: 8,
          maxRotation: 45,
          minRotation: 0
        },
        grid: { 
          color: '#374151',
          drawBorder: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Price (USD)',
          color: '#fff',
          font: { size: 12 }
        },
        ticks: { 
          color: '#fff',
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
          stepSize: activeTab === 'BTC' ? 20000 : 500,
          autoSkip: false,
          maxTicksLimit: 15
        },
        grid: { 
          color: '#374151',
          drawBorder: false
        }
      }
    },
            elements: {
          point: {
            radius: timeframe === '7d' ? 4 : timeframe === '30d' ? 3 : 2,
            hoverRadius: 6
          },
          line: {
            tension: 0.1
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
  };

  const priceChange = activeData.price_change;
  const priceChangePercent = activeData.price_change_percent;
  const isPositive = priceChange > 0;

  return (
    <div className="w-full h-full">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full flex flex-col min-h-[600px]">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">
            {activeTab} {timeframe === '7d' ? '7-Day' : timeframe === '30d' ? '30-Day' : timeframe === '6m' ? '6-Month' : '1-Year'} Price History
            {activeData.note && (
              <span className="text-sm text-yellow-400 ml-2">({activeData.note})</span>
            )}
          </h2>
          
          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {/* Timeframe Selection */}
            <div className="bg-slate-700 rounded-lg p-1">
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  timeframe === '7d' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                onClick={() => setTimeframe('7d')}
              >
                7D
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  timeframe === '30d' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                onClick={() => setTimeframe('30d')}
              >
                30D
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  timeframe === '6m' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                onClick={() => setTimeframe('6m')}
              >
                6M
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  timeframe === '1y' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                onClick={() => setTimeframe('1y')}
              >
                1Y
              </button>
            </div>

            {/* Currency Selection */}
            <div className="bg-slate-700 rounded-lg p-1">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'BTC' 
                    ? 'bg-amber-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                onClick={() => setActiveTab('BTC')}
              >
                BTC
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'ETH' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                onClick={() => setActiveTab('ETH')}
              >
                ETH
              </button>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="mb-6 p-4 bg-slate-700 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-sm">Current Price</p>
              <p className="text-xl font-bold text-slate-100">
                ${activeData.current_price?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">
                {timeframe === '7d' ? '7-Day' : timeframe === '30d' ? '30-Day' : timeframe === '6m' ? '6-Month' : '1-Year'} Change
              </p>
              <p className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {priceChangePercent ? `${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart - Main Focus */}
        <div className="flex-1 min-h-0">
          <div className="h-full w-full min-h-[400px]">
            <Line data={chartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Historical; 