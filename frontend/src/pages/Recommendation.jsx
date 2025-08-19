import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

export default function Recommendation() {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        setLoading(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const response = await axios.get(`${API_URL}/recommendation`, {
          headers: getAuthHeaders()
        });
        setRecommendation(response.data);
        setError(null);
      } catch (err) {
        const msg = 'Failed to load recommendation';
        setError(msg);
        setRecommendation(null);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [getAuthHeaders]);

  if (loading) {
    return <Spinner message="Loading recommendation..." />;
  }

  if (error) {
    return (
      <div className="w-full h-full">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100">
          <h2 className="text-2xl font-semibold mb-4">Strategy Recommendation</h2>
          <div className="text-red-400 italic">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100">
        <h2 className="text-2xl font-semibold mb-4">Strategy Recommendation</h2>
        
        {recommendation ? (
          <div className="flex flex-col gap-3 items-center">
            {['BTC', 'ETH'].map(symbol => (
              <div key={symbol} className="bg-slate-700 rounded p-3 w-full max-w-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{symbol}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    recommendation[symbol]?.recommendation === 'BUY' 
                      ? 'bg-green-600 text-white' 
                      : recommendation[symbol]?.recommendation === 'SELL'
                      ? 'bg-red-600 text-white'
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {recommendation[symbol]?.recommendation || 'HOLD'}
                  </span>
                </div>
                {recommendation[symbol]?.reason && (
                  <p className="text-sm text-slate-300 mt-2 text-left">
                    {recommendation[symbol].reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 italic">No recommendation available</div>
        )}
      </div>
    </div>
  );
}