import { useEffect, useState } from 'react';
import useDataStore from '../store/useDataStore';
import { useAuth } from '../context/AuthContext';

// Helper to map score (-1 to 1) to percent (0 to 100)
function scoreToPercent(score) {
  return Math.round(((score + 1) / 2) * 100);
}

// Helper to render a sentiment bar with a custom color
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

function SentimentSource({ label, score, colorClass }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="font-semibold text-slate-300 text-base">{label}</span>
        <span className="text-base font-mono">
          {score >= 0 ? '+' : ''}{score?.toFixed(2)}
        </span>
      </div>
      <SentimentBar score={score || 0} colorClass={colorClass} />
    </div>
  );
}

export default function Sentiment() {
  const { sentiment, setSentiment } = useDataStore();
  const [error, setError] = useState(null);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    if (!sentiment) {
      fetch('http://127.0.0.1:5000/sentiment', {
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
          setError('Unable to load sentiment data. Please try again later.');
          setSentiment(null);
        });
    }
  }, [sentiment, setSentiment, getAuthHeaders]);

  return (
    <div className="w-full h-full">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100">
        <h2 className="text-2xl font-semibold mb-4">Market Sentiment</h2>

        {error ? (
          <p className="text-red-400 italic">{error}</p>
        ) : sentiment ? (
          <>
            {sentiment.BTC && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-semibold text-amber-400 text-lg">BTC</span>
                </div>
                <SentimentSource label="Reddit" score={sentiment.BTC.reddit_sentiment?.average || 0} colorClass="bg-amber-400" />
                <SentimentSource label="CoinDesk" score={sentiment.BTC.coindesk_sentiment?.average || 0} colorClass="bg-amber-400" />
                <SentimentSource label="CoinTelegraph" score={sentiment.BTC.cointelegraph_sentiment?.average || 0} colorClass="bg-amber-400" />
              </div>
            )}
            {sentiment.ETH && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-semibold text-blue-400 text-lg">ETH</span>
                </div>
                <SentimentSource label="Reddit" score={sentiment.ETH.reddit_sentiment?.average || 0} colorClass="bg-blue-400" />
                <SentimentSource label="CoinDesk" score={sentiment.ETH.coindesk_sentiment?.average || 0} colorClass="bg-blue-400" />
                <SentimentSource label="CoinTelegraph" score={sentiment.ETH.cointelegraph_sentiment?.average || 0} colorClass="bg-blue-400" />
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-400 italic">Loading sentiment...</p>
        )}
      </div>
    </div>
  );
}
