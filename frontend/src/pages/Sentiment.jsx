import { useEffect } from 'react';
import useDataStore from '../store/useDataStore';

export default function Sentiment() {
  const { sentiment, setSentiment } = useDataStore();

  useEffect(() => {
    if (!sentiment) {
      fetch('http://127.0.0.1:5000/sentiment')
        .then(res => res.json())
        .then(data => setSentiment(data))
        .catch(err => console.error("Error fetching /sentiment:", err));
    }
  }, [sentiment, setSentiment]);

  return (
    <div className="w-full h-full">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100">
        <h2 className="text-2xl font-semibold mb-4">Market Sentiment</h2>

        {sentiment ? (
          <>
            {sentiment.BTC && (
              <p className="text-lg text-slate-200 mb-2">
                <span className="font-semibold text-amber-400">BTC</span>: {sentiment.BTC.sentiment}
                <span className="text-sm text-slate-400"> (Score: {sentiment.BTC.score})</span>
              </p>
            )}
            {sentiment.ETH && (
              <p className="text-lg text-slate-200">
                <span className="font-semibold text-blue-400">ETH</span>: {sentiment.ETH.sentiment}
                <span className="text-sm text-slate-400"> (Score: {sentiment.ETH.score})</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-slate-400 italic">Loading sentiment...</p>
        )}
      </div>
    </div>
  );
}
