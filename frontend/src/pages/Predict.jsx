import { useEffect } from 'react';
import useDataStore from '../store/useDataStore';

export default function Predict() {
  const { predict, setPredict } = useDataStore();

  useEffect(() => {
    if (!predict) {
      fetch('http://127.0.0.1:5000/predict')
        .then(res => res.json())
        .then(data => setPredict(data))
        .catch(err => console.error("Error fetching /predict:", err));
    }
  }, [predict, setPredict]);

  return (
    <div className="bg-white shadow-md rounded-xl p-8 max-w-xl w-full text-center">
      <h2 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
        Prediction
      </h2>
      {predict ? (
        <p className="text-lg">
          <span className="font-bold text-indigo-600">{predict.symbol}:</span>{' '}
          {predict.prediction}
        </p>
      ) : (
        <p className="text-gray-500 italic">Loading prediction...</p>
      )}
    </div>
  );
}
