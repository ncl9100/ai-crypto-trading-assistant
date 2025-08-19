import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify'; // <-- ADD THIS

function scoreToPercent(score) {
  return Math.round(((score + 1) / 2) * 100);
}

function SentimentBar({ score, colorClass }) {
  const percent = scoreToPercent(score);
  return (
    <div className="w-full h-5 bg-slate-700 rounded overflow-hidden mt-2 mb-4">
      <div
        className={`h-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function AverageSentimentCard() {
  const [sentiment, setSentiment] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    setLoading(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  fetch(`${API_URL}/sentiment`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setSentiment(data);
        setError(null);
      })
      .catch(err => {
        const msg = 'Unable to load sentiment data. Please try again later.';
        setError(msg);
        setSentiment(null);
        toast.error(msg); // <-- ADD THIS
      })
      .finally(() => setLoading(false));
  }, [getAuthHeaders]);

  if (loading) return <Spinner message="Loading sentiment..." />;

  function getOverallAverage(coin) {
    if (!sentiment || !sentiment[coin]) return 0;
    const s = sentiment[coin];
    const values = [
      s.reddit_sentiment?.average,
      s.coindesk_sentiment?.average,
      s.cointelegraph_sentiment?.average,
    ].filter(v => typeof v === 'number');
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  const btcAvg = getOverallAverage('BTC');
  const ethAvg = getOverallAverage('ETH');

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold mb-4">Overall Market Sentiment</h2>
      {error ? (
        <p className="text-red-400 italic">{error}</p>
      ) : sentiment ? (
        <>
          <div className="mb-8 w-full max-w-xs mx-auto">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="font-semibold text-amber-400 text-lg">BTC</span>
              <span className="text-lg font-mono">
                {btcAvg >= 0 ? '+' : ''}{btcAvg.toFixed(2)}
              </span>
            </div>
            <SentimentBar score={btcAvg} colorClass="bg-amber-400" />
          </div>
          <div className="mb-4 w-full max-w-xs mx-auto">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="font-semibold text-blue-400 text-lg">ETH</span>
              <span className="text-lg font-mono">
                {ethAvg >= 0 ? '+' : ''}{ethAvg.toFixed(2)}
              </span>
            </div>
            <SentimentBar score={ethAvg} colorClass="bg-blue-400" />
          </div>
        </>
      ) : (
        <p className="text-slate-400 italic">Loading sentiment...</p>
      )}
    </div>
  );
}