import { Routes, Route } from 'react-router-dom';
import DashboardShell from './pages/DashboardShell.jsx';
import Price from './pages/Price.jsx';
import Predict from './pages/Predict.jsx';
import Sentiment from './pages/Sentiment.jsx';
import AverageSentimentCard from './pages/AverageSentimentCard.jsx';
import { FaChartLine } from 'react-icons/fa'; // Icon for dashboard title
import MiniTrendChart from './pages/MiniTrendChart.jsx';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Historical from './pages/Historical.jsx';

function AppContent() {
  // Prepare BTC and ETH chart data for dashboard card
  const [btcChartData, setBtcChartData] = useState(null);
  const [ethChartData, setEthChartData] = useState(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState('BTC');
  const { isAuthenticated, getAuthHeaders } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) return;
    
    axios.get('http://localhost:5000/predict', {
      headers: getAuthHeaders()
    })
      .then(res => {
        const data = res.data;
        // BTC
        if (data && data.BTC) {
          const btcDates = Array.isArray(data.BTC?.dates) ? data.BTC.dates : [];
          const btcLabels = btcDates.map((date, idx) => {
            if (idx === btcDates.length - 1) return 'Next Day';
            return format(parseISO(date), 'MMM d');
          });
          const btcHistory = Array.isArray(data.BTC?.history) ? data.BTC.history : [];
          const btcPrediction = typeof data.BTC?.predicted_price === 'number' ? data.BTC?.predicted_price : null;
          const btcDataArr = btcPrediction !== null ? [...btcHistory, btcPrediction] : btcHistory;
          const btcPointBackgroundColors = Array(Math.max(0, btcDataArr.length - 1)).fill('#f7931a');
          btcPointBackgroundColors.push('#ff0000');
          const btcPointRadius = Array(Math.max(0, btcDataArr.length - 1)).fill(0);
          btcPointRadius.push(8);
          const btcPointStyle = Array(Math.max(0, btcDataArr.length - 1)).fill('circle');
          btcPointStyle.push('triangle');
          setBtcChartData({
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
                datalabels: {
                  display: (ctx) => ctx.dataIndex === btcDataArr.length - 1,
                  align: 'end',
                  anchor: 'end',
                  formatter: () => 'Prediction',
                },
              },
            ],
          });
        }
        // ETH
        if (data && data.ETH) {
          const ethDates = Array.isArray(data.ETH?.dates) ? data.ETH.dates : [];
          const ethLabels = ethDates.map((date, idx) => {
            if (idx === ethDates.length - 1) return 'Next Day';
            return format(parseISO(date), 'MMM d');
          });
          const ethHistory = Array.isArray(data.ETH?.history) ? data.ETH.history : [];
          const ethPrediction = typeof data.ETH?.predicted_price === 'number' ? data.ETH?.predicted_price : null;
          const ethDataArr = ethPrediction !== null ? [...ethHistory, ethPrediction] : ethHistory;
          const ethPointBackgroundColors = Array(Math.max(0, ethDataArr.length - 1)).fill('#627eea');
          ethPointBackgroundColors.push('#00ffea');
          const ethPointRadius = Array(Math.max(0, ethDataArr.length - 1)).fill(0);
          ethPointRadius.push(8);
          const ethPointStyle = Array(Math.max(0, ethDataArr.length - 1)).fill('circle');
          ethPointStyle.push('rectRot');
          setEthChartData({
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
                datalabels: {
                  display: (ctx) => ctx.dataIndex === ethDataArr.length - 1,
                  align: 'end',
                  anchor: 'end',
                  formatter: () => 'Prediction',
                },
              },
            ],
          });
        }
      })
      .catch(() => {
        setBtcChartData(null);
        setEthChartData(null);
      });
  }, [isAuthenticated, getAuthHeaders]);

  return (
    <DashboardShell>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="p-6 md:p-10 text-center text-slate-100">
                <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-2">
                  <FaChartLine className="text-indigo-400" />
                  Crypto Dashboard
                </h1>
                <p className="text-slate-400 mb-8 text-sm md:text-base">
                  Your AI-powered assistant for real-time crypto insights
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center max-w-7xl mx-auto">
                  <div className="w-full max-w-md min-h-[250px]">
                    <Price />
                  </div>
                  <div className="w-full max-w-md min-h-[250px]">
                    <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100 flex flex-col items-center justify-center">
                      <h2 className="text-2xl font-semibold mb-4">Price Trend & Next-Day Prediction</h2>
                      <div className="flex justify-center mb-4">
                        <button
                          className={`px-6 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors duration-200 ${activeDashboardTab === 'BTC' ? 'bg-slate-700 text-amber-400' : 'bg-slate-900 text-slate-300'}`}
                          onClick={() => setActiveDashboardTab('BTC')}
                        >
                          BTC
                        </button>
                        <button
                          className={`px-6 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors duration-200 ${activeDashboardTab === 'ETH' ? 'bg-slate-700 text-blue-400' : 'bg-slate-900 text-slate-300'}`}
                          onClick={() => setActiveDashboardTab('ETH')}
                        >
                          ETH
                        </button>
                      </div>
                      {activeDashboardTab === 'BTC' ? (
                        btcChartData ? (
                          <MiniTrendChart data={btcChartData} />
                        ) : (
                          <div className="text-slate-400 italic">Loading...</div>
                        )
                      ) : (
                        ethChartData ? (
                          <MiniTrendChart data={ethChartData} />
                        ) : (
                          <div className="text-slate-400 italic">Loading...</div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="w-full max-w-md min-h-[250px]">
                    <AverageSentimentCard />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        <Route path="/price" element={<ProtectedRoute><Price /></ProtectedRoute>} />
        <Route path="/predict" element={<ProtectedRoute><Predict /></ProtectedRoute>} />
        <Route path="/sentiment" element={<ProtectedRoute><Sentiment /></ProtectedRoute>} />
        <Route path="/historical" element={<ProtectedRoute><Historical /></ProtectedRoute>} />
      </Routes>
    </DashboardShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; // if another file imports this file, it will get the App component
