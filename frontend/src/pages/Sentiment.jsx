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
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Market Sentiment</h2>

      {sentiment ? (
        <p className="text-lg text-gray-700">
          <span className="font-bold text-purple-600">{sentiment.symbol}</span>:{" "}
          {sentiment.sentiment}{" "}
          <span className="text-sm text-gray-500">(Score: {sentiment.score})</span>
        </p>
      ) : (
        <p className="text-gray-500 italic">Loading...</p>
      )}
    </div>
  );
}
