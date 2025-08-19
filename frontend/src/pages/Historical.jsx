import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify'; // <-- ADD THIS
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeaders } = useAuth();

  const fetchHistoricalData = (selectedTimeframe) => {
    setIsLoading(true);
    setError(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  axios.get(`${API_URL}/historical?timeframe=${selectedTimeframe}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to load historical data';
        setError(msg);
        toast.error(msg); // <-- ADD THIS
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchHistoricalData(timeframe);
  }, [getAuthHeaders, timeframe]);

  if (isLoading) return <Spinner message="Loading historical data..." />;
  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!data) return <Spinner message="Loading historical data..." />;

  // Get data for active tab
  const activeData = data[activeTab];
  if (!activeData || activeData.error) {
    return <div className="text-red-400">Error loading {activeTab} data: {activeData?.error || 'Unknown error'}</div>;
  }

  // Sample data based on timeframe to prevent overcrowding
  const sampleData = (dates, prices, timeframe) => {
    const totalPoints = dates.length;
    
    // For 6-month and 1-year views, sample to show consistent monthly data
    if (timeframe === '6m' || timeframe === '1y') {
      const sampledDates = [];
      const sampledPrices = [];
      
      // For 6-month view: show last day of each month
      if (timeframe === '6m') {
        const monthsToShow = 6;
        const step = Math.max(1, Math.floor(totalPoints / monthsToShow));
        
        for (let i = 0; i < totalPoints; i += step) {
          sampledDates.push(dates[i]);
          sampledPrices.push(prices[i]);
        }
      }
      // For 1-year view: show last day of each month
      else if (timeframe === '1y') {
        const monthsToShow = 12;
        const step = Math.max(1, Math.floor(totalPoints / monthsToShow));
        
        for (let i = 0; i < totalPoints; i += step) {
          sampledDates.push(dates[i]);
          sampledPrices.push(prices[i]);
        }
      }
      
      // Always include the last point if not already included
      if (sampledDates[sampledDates.length - 1] !== dates[dates.length - 1]) {
        sampledDates.push(dates[dates.length - 1]);
        sampledPrices.push(prices[prices.length - 1]);
      }
      
      return { sampledDates, sampledPrices };
    }
    
    // For shorter timeframes, use the original logic
    let maxPoints;
    if (timeframe === '7d') {
      maxPoints = totalPoints; // Show all points for 7 days
    } else if (timeframe === '30d') {
      maxPoints = 15; // Max 15 points for 30 days
    }
    
    // If we have fewer points than max, return all data
    if (totalPoints <= maxPoints) {
      return { sampledDates: dates, sampledPrices: prices };
    }
    
    // Calculate step to get desired number of points
    const step = Math.floor(totalPoints / maxPoints);
    
    const sampledDates = [];
    const sampledPrices = [];
    
    // Sample data with step
    for (let i = 0; i < totalPoints; i += step) {
      sampledDates.push(dates[i]);
      sampledPrices.push(prices[i]);
    }
    
    // Always include the last point if not already included
    if (sampledDates[sampledDates.length - 1] !== dates[dates.length - 1]) {
      sampledDates.push(dates[dates.length - 1]);
      sampledPrices.push(prices[prices.length - 1]);
    }
    
    return { sampledDates, sampledPrices };
  };

  const { sampledDates, sampledPrices } = sampleData(activeData.dates, activeData.prices, timeframe);

  // Prepare chart data with appropriate date format based on timeframe
  const labels = sampledDates.map((date, idx) => {
    if (timeframe === '1y') {
      return format(parseISO(date), 'MMM yyyy'); // Show year for 1-year view
    } else if (timeframe === '6m') {
      return format(parseISO(date), 'MMM yyyy'); // Show year for 6-month view too
    } else {
      return format(parseISO(date), 'MMM d'); // Show month and day for shorter views
    }
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
        pointRadius: timeframe === '7d' ? 4 : timeframe === '30d' ? 3 : timeframe === '6m' ? 2 : 1,
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
          title: function(context) {
            // Show full date in tooltip regardless of timeframe
            const dateIndex = context[0].dataIndex;
            const actualDate = sampledDates[dateIndex];
            return format(parseISO(actualDate), 'MMMM d, yyyy'); // e.g., "August 15, 2025"
          },
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
          // Dynamic step size based on price range and currency
          stepSize: function() {
            const maxPrice = Math.max(...sampledPrices);
            const minPrice = Math.min(...sampledPrices);
            const priceRange = maxPrice - minPrice;
            
            if (activeTab === 'BTC') {
              // Target 4-8 gridlines
              if (priceRange > 50000) return 15000;
              if (priceRange > 25000) return 7500;
              if (priceRange > 15000) return 5000;
              if (priceRange > 10000) return 3000;
              if (priceRange > 5000) return 2000;
              return 1500;
            } else { // ETH
              // Target 4-8 gridlines
              if (priceRange > 2000) return 750;
              if (priceRange > 1000) return 500;
              if (priceRange > 500) return 250;
              if (priceRange > 200) return 100;
              return 50;
            }
          }(),
          autoSkip: false,
          maxTicksLimit: 15
        },
        grid: { 
          color: '#374151',
          drawBorder: false,
          display: true
        }
      }
    },
            elements: {
          point: {
            radius: timeframe === '7d' ? 4 : timeframe === '30d' ? 3 : timeframe === '6m' ? 2 : 1,
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