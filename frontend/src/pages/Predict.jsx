import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
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
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = import.meta.env.VITE_API_URL;

const Predict = () => {
  const { getAuthHeaders } = useAuth();
  const [coin, setCoin] = useState('BTC');
  // Format price to 2 decimal places
  const formatPrice = (price) => typeof price === 'number' ? price.toFixed(2) : price;
  const [actualData, setActualData] = useState({ BTC: [], ETH: [] });
  const [predictedData, setPredictedData] = useState({ BTC: [], ETH: [] });
  const [fullDates, setFullDates] = useState({ BTC: [], ETH: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDateRaw] = useState('');

  const setSelectedDate = (date) => {
    setSelectedDateRaw(date);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        const response = await axios.get(
          `${API_URL}/predict?window=30`,
          { headers }
        );
        const result = response.data;
        setActualData({
          BTC: (result.BTC.dates || []).map((date, i) => ({ date, price: formatPrice(result.BTC.actual[i]) })),
          ETH: (result.ETH.dates || []).map((date, i) => ({ date, price: formatPrice(result.ETH.actual[i]) })),
        });
        setPredictedData({
          BTC: (result.BTC.dates || []).map((date, i) => ({ date, price: formatPrice(result.BTC.predicted[i]) })),
          ETH: (result.ETH.dates || []).map((date, i) => ({ date, price: formatPrice(result.ETH.predicted[i]) })),
        });
        setFullDates({
          BTC: result.BTC.dates || [],
          ETH: result.ETH.dates || [],
        });
        setError(null);
      } catch (err) {
        setError('Failed to fetch prediction data');
      }
      setLoading(false);
    };
    fetchData();
  }, [getAuthHeaders]);

  const normalizeDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toISOString().slice(0, 10);
  };

  const allDates = fullDates[coin].map((d) => normalizeDate(d));

  let chartDates = allDates;
  let chartActual = actualData[coin];
  let chartPredicted = predictedData[coin];
  let predictionValue = null;
  if (selectedDate) {
    const idx = predictedData[coin].findIndex((d) => {
      return normalizeDate(d.date) === normalizeDate(selectedDate) || d.date === selectedDate;
    });
    if (idx !== -1) {
      predictionValue = predictedData[coin][idx]?.price ?? null;
      chartDates = predictedData[coin].slice(0, idx + 1).map((d) => normalizeDate(d.date));
      chartActual = actualData[coin].slice(0, Math.min(idx + 1, actualData[coin].length));
      chartPredicted = predictedData[coin].slice(0, idx + 1);
    }
  }

  const actualPrices = chartActual.map((d) => d.price);
  const predictedPrices = chartPredicted.map((d) => d.price);

  // Format x-axis labels as 'MMM D' (e.g., Aug 16)
  const formattedChartDates = chartDates.map(date => {
    const d = new Date(date);
    if (isNaN(d)) return date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartData = {
    labels: formattedChartDates,
    datasets: [
      {
        label: 'Actual',
        data: actualPrices,
        borderColor: coin === 'BTC' ? '#FFA500' : '#0074D9',
        backgroundColor: coin === 'BTC' ? 'rgba(255,165,0,0.2)' : 'rgba(0,116,217,0.2)',
        pointRadius: 3,
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Predicted',
        data: predictedPrices,
        borderColor: coin === 'BTC' ? '#00BFFF' : '#2ECC40',
        backgroundColor: coin === 'BTC' ? 'rgba(0,191,255,0.2)' : 'rgba(46,204,64,0.2)',
        pointRadius: predictedPrices.map((_, i) => {
          if (!selectedDate) return 0;
          const idx = chartDates.findIndex(d => d === normalizeDate(selectedDate));
          return i === idx ? 6 : 0;
        }),
        pointHoverRadius: predictedPrices.map((_, i) => {
          if (!selectedDate) return 0;
          const idx = chartDates.findIndex(d => d === normalizeDate(selectedDate));
          return i === idx ? 8 : 0;
        }),
        borderDash: [6, 6],
        fill: false,
        spanGaps: true,
        tension: 0,
      },
    ],
  };

  // Responsive font and tick settings
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const chartContainerRef = useRef(null);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  const fontSize = isMobile ? 12 : 18;
  const legendFontSize = isMobile ? 13 : 20;
  const legendPadding = isMobile ? 8 : 10;
  const xMaxTicks = isMobile ? 3 : 7;
  const yMaxTicks = 7;
  const gridColor = '#334155';

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#fff',
          font: {
            family: fontFamily,
            size: legendFontSize,
            weight: 'bold',
          },
          padding: legendPadding,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#232946',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
      },
    },
    layout: {
      padding: {
        right: isMobile ? 10 : 30,
        left: isMobile ? 10 : 30,
        top: 0,
        bottom: isMobile ? 0 : 0,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day',
          align: 'center',
          font: {
            family: fontFamily,
            size: fontSize,
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        ticks: {
          align: 'center',
          font: {
            family: fontFamily,
            size: fontSize,
          },
          padding: 6,
          color: '#fff',
          maxTicksLimit: xMaxTicks,
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          color: gridColor,
          drawOnChartArea: true,
          drawTicks: true,
        },
      },
      y: {
        title: {
          display: true,
          text: 'USD',
          align: 'center',
          font: {
            family: fontFamily,
            size: fontSize,
            weight: 'bold',
            color: '#fff',
          },
          color: '#fff',
        },
        ticks: {
          align: 'center',
          font: {
            family: fontFamily,
            size: fontSize,
          },
          padding: 10,
          color: '#fff',
          maxTicksLimit: yMaxTicks,
          minTicksLimit: 4,
        },
        grid: {
          color: gridColor,
          drawOnChartArea: true,
          drawTicks: true,
        },
      },
    },
  };

  if (loading) return <Spinner message="Loading prediction..." />;

  return (
    <div className="flex justify-center">
      <div className="bg-slate-800 rounded-xl shadow-lg p-2 sm:p-6 w-full text-center text-slate-100 mx-auto max-w-full sm:max-w-3xl">
        <h2 className="text-2xl font-bold mb-8">Historical Price & Model Forecast</h2>
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${coin === 'BTC' ? 'bg-slate-700 text-yellow-400' : 'bg-slate-900 text-slate-100'} border border-slate-600 rounded-l-md focus:outline-none`}
              onClick={() => setCoin('BTC')}
            >
              BTC
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${coin === 'ETH' ? 'bg-slate-700 text-blue-400' : 'bg-slate-900 text-slate-100'} border border-slate-600 rounded-r-md focus:outline-none`}
              onClick={() => setCoin('ETH')}
            >
              ETH
            </button>
          </div>
        </div>
        <div
          ref={chartContainerRef}
          className="chart-container"
          style={{
            minHeight: isMobile ? 260 : 350,
            height: isMobile ? 260 : 'auto',
            marginBottom: isMobile ? '0px' : '32px',
            marginTop: isMobile ? '0px' : '0px',
            width: '100%',
            maxWidth: isMobile ? '100vw' : '100%',
            paddingBottom: isMobile ? '0px' : undefined,
          }}
        >
          <Line
            key={isMobile ? 'mobile' : 'desktop'}
            data={{
              ...chartData,
              datasets: chartData.datasets.map((ds, idx) => ({
                ...ds,
                pointRadius: isMobile ? 0 : ds.pointRadius,
                pointHoverRadius: isMobile ? 0 : ds.pointHoverRadius,
              })),
            }}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  labels: {
                    ...chartOptions.plugins.legend.labels,
                    font: {
                      ...chartOptions.plugins.legend.labels.font,
                      size: legendFontSize,
                    },
                    padding: legendPadding,
                  },
                },
              },
              layout: {
                ...chartOptions.layout,
                padding: {
                  ...chartOptions.layout?.padding,
                  top: 0,
                  bottom: isMobile ? 0 : 0,
                },
              },
            }}
          />
        </div>
  <div className={isMobile ? "mt-0 flex flex-col items-center" : "mt-6 flex flex-col items-center"} style={isMobile ? {paddingBottom: 0, marginBottom: 0} : {}}>
          <label
            htmlFor="date-picker"
            className="block text-lg font-semibold text-white mb-2 tracking-wide"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          >
            Select a date to predict
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={allDates.length > 0 ? allDates[0] : ''}
            max={allDates.length > 0 ? allDates[allDates.length - 1] : ''}
            className="px-4 py-2 rounded-md bg-[#232946] text-white border-none text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', width: 'fit-content' }}
          />
        </div>
        {selectedDate && (
          <div className={isMobile ? "mt-2 flex flex-col items-center gap-2" : "mt-6 flex flex-col items-center gap-2"}>
            <div className="text-base font-semibold text-white tracking-wide" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
              Prediction for {selectedDate}
            </div>
            <div className="flex flex-row gap-6">
              <div
                className={`bg-slate-700 rounded-lg px-4 py-2 text-lg font-mono shadow ${
                  coin === 'BTC'
                    ? 'text-[#FFA500]'
                    : 'text-[#00BFFF]'
                }`}
              >
                {coin} Actual: {(() => {
                  const idx = actualData[coin].findIndex(d => normalizeDate(d.date) === normalizeDate(selectedDate));
                  const actualPrice = idx !== -1 ? actualData[coin][idx]?.price : null;
                  return actualPrice !== null ? `$${actualPrice}` : 'N/A';
                })()}
              </div>
              <div
                className={`bg-slate-700 rounded-lg px-4 py-2 text-lg font-mono shadow ${
                  coin === 'BTC'
                    ? 'text-[#00BFFF]'
                    : 'text-[#2ECC40]'
                }`}
              >
                {coin} Predicted: {predictionValue !== null ? `$${predictionValue}` : 'N/A'}
              </div>
            </div>
          </div>
        )}
        {error && <div className="text-red-400 mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default Predict;
