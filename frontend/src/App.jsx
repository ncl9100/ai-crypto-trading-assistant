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
import Recommendation from './pages/Recommendation.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppContent() {
  // Prepare BTC and ETH chart data for dashboard card
  const [btcChartData, setBtcChartData] = useState(null);
  const [ethChartData, setEthChartData] = useState(null);
  const [btcRawResponse, setBtcRawResponse] = useState(null);
  const [ethRawResponse, setEthRawResponse] = useState(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState('BTC');
  const { isAuthenticated, getAuthHeaders } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) return;
    
    const API_URL = import.meta.env.VITE_API_URL;
    axios.get(`${API_URL}/predict`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        const data = res.data;
        // BTC
        if (data && data.BTC) {
          setBtcRawResponse(data.BTC);
          const btcDates = Array.isArray(data.BTC?.dates) ? data.BTC.dates : [];
          const btcLabels = btcDates.map((date, idx) => {
            if (idx === btcDates.length - 1) return 'Next Day';
            return format(parseISO(date), 'MMM d');
          });
          const btcHistory = Array.isArray(data.BTC?.actual) ? data.BTC.actual.filter(v => v !== null) : [];
          const btcPrediction = Array.isArray(data.BTC?.predicted) && data.BTC.predicted.length > 0 ? data.BTC.predicted[data.BTC.predicted.length - 1] : null;
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
                 label: 'Actual',
                 data: btcHistory,
                 borderColor: '#f7931a',
                 backgroundColor: '#f7931a33',
                 tension: 0.2,
                 pointBackgroundColor: Array(btcHistory.length).fill('#f7931a'),
                 pointRadius: Array(btcHistory.length).fill(0),
                 pointHoverRadius: Array(btcHistory.length).fill(0),
                 pointStyle: Array(btcHistory.length).fill('circle'),
                 clip: false,
               },
               {
                 label: 'Predicted',
                 data: Array.isArray(data.BTC?.predicted) ? data.BTC.predicted : [],
                 borderColor: '#ff0000',
                 backgroundColor: '#ff000033',
                 tension: 0.2,
                 pointBackgroundColor: Array(Array.isArray(data.BTC?.predicted) ? data.BTC.predicted.length : 0).fill('#ff0000'),
                 pointRadius: Array(Array.isArray(data.BTC?.predicted) ? data.BTC.predicted.length : 0).fill(2),
                 pointHoverRadius: Array(Array.isArray(data.BTC?.predicted) ? data.BTC.predicted.length : 0).fill(4),
                 pointStyle: Array(Array.isArray(data.BTC?.predicted) ? data.BTC.predicted.length : 0).fill('triangle'),
                 clip: false,
               },
             ],
           });
        }
        // ETH
        if (data && data.ETH) {
          setEthRawResponse(data.ETH);
          const ethDates = Array.isArray(data.ETH?.dates) ? data.ETH.dates : [];
          const ethLabels = ethDates.map((date, idx) => {
            if (idx === ethDates.length - 1) return 'Next Day';
            return format(parseISO(date), 'MMM d');
          });
          const ethHistory = Array.isArray(data.ETH?.actual) ? data.ETH.actual.filter(v => v !== null) : [];
          const ethPrediction = Array.isArray(data.ETH?.predicted) && data.ETH.predicted.length > 0 ? data.ETH.predicted[data.ETH.predicted.length - 1] : null;
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
                 label: 'Actual',
                 data: ethHistory,
                 borderColor: '#627eea',
                 backgroundColor: '#627eea33',
                 tension: 0.2,
                 pointBackgroundColor: Array(ethHistory.length).fill('#627eea'),
                 pointRadius: Array(ethHistory.length).fill(0),
                 pointHoverRadius: Array(ethHistory.length).fill(0),
                 pointStyle: Array(ethHistory.length).fill('circle'),
                 clip: false,
               },
               {
                 label: 'Predicted',
                 data: Array.isArray(data.ETH?.predicted) ? data.ETH.predicted : [],
                 borderColor: '#00ffea',
                 backgroundColor: '#00ffea33',
                 tension: 0.2,
                 pointBackgroundColor: Array(Array.isArray(data.ETH?.predicted) ? data.ETH.predicted.length : 0).fill('#00ffea'),
                 pointRadius: Array(Array.isArray(data.ETH?.predicted) ? data.ETH.predicted.length : 0).fill(2),
                 pointHoverRadius: Array(Array.isArray(data.ETH?.predicted) ? data.ETH.predicted.length : 0).fill(4),
                 pointStyle: Array(Array.isArray(data.ETH?.predicted) ? data.ETH.predicted.length : 0).fill('rectRot'),
                 clip: false,
               },
             ],
           });
        }
      })
      .catch((error) => {
        console.error('Error fetching prediction data:', error);
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
                      <h2 className="text-2xl font-semibold mb-4">Historical Price & Model Forecast</h2>
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
                        <MiniTrendChart
                          actual={(() => {
                            if (!btcRawResponse || !btcRawResponse.actual || !btcRawResponse.dates) return [];
                            return btcRawResponse.actual
                              .map((price, i) => ({ date: btcRawResponse.dates[i], price }))
                              .filter(d => d.price !== null);
                          })()}
                          predicted={(() => {
                            if (!btcRawResponse || !btcRawResponse.predicted || !btcRawResponse.dates) return [];
                            return btcRawResponse.predicted.map((price, i) => ({ date: btcRawResponse.dates[i], price }));
                          })()}
                          coin="BTC"
                          loading={!btcRawResponse}
                        />
                      ) : (
                        <MiniTrendChart
                          actual={(() => {
                            if (!ethRawResponse || !ethRawResponse.actual || !ethRawResponse.dates) return [];
                            return ethRawResponse.actual
                              .map((price, i) => ({ date: ethRawResponse.dates[i], price }))
                              .filter(d => d.price !== null);
                          })()}
                          predicted={(() => {
                            if (!ethRawResponse || !ethRawResponse.predicted || !ethRawResponse.dates) return [];
                            return ethRawResponse.predicted.map((price, i) => ({ date: ethRawResponse.dates[i], price }));
                          })()}
                          coin="ETH"
                          loading={!ethRawResponse}
                        />
                      )}
                      {/* Debug output removed */}
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
        <Route path="/recommendation" element={<ProtectedRoute><Recommendation /></ProtectedRoute>} />
      </Routes>
    </DashboardShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={4000} />
      <AppContent />
    </AuthProvider>
  );
}

export default App; // if another file imports this file, it will get the App component
