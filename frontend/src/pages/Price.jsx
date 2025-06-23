import { useEffect } from 'react';
import useDataStore from '../store/useDataStore';

export default function Price() {
  const { price, setPrice } = useDataStore();

  useEffect(() => {
    if (!price) {
      fetch('http://127.0.0.1:5000/price')
        .then(res => res.json())
        .then(data => setPrice(data))
        .catch(err => console.error("Error fetching /price:", err));
    }
  }, [price, setPrice]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Live Price</h2>

      {price ? (
        <p className="text-lg text-gray-700">
          <span className="font-bold text-blue-600">{price.symbol}</span>: ${price.price}
        </p>
      ) : (
        <p className="text-gray-500 italic">Loading...</p>
      )}
    </div>
  );
}
