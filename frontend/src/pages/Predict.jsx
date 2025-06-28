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
    <div className="w-full h-full">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100">
        <h2 className="text-2xl font-semibold mb-4">Prediction</h2>

        {predict ? (
          <>
            {predict.BTC && (
              <p className="text-lg mb-2">
                <span className="font-semibold text-amber-400">BTC:</span> {predict.BTC.prediction}
              </p>
            )}
            {predict.ETH && (
              <p className="text-lg">
                <span className="font-semibold text-blue-400">ETH:</span> {predict.ETH.prediction}
              </p>
            )}
          </>
        ) : (
          <p className="text-slate-400 italic">Loading prediction...</p>
        )}
      </div>
    </div>
  );
}
