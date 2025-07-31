import { useEffect, useState } from 'react';
import axios from 'axios';
import useDataStore from '../store/useDataStore';
import { useAuth } from '../context/AuthContext';

export default function Price() {
  const { price, setPrice, lastUpdated } = useDataStore(); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated) {
        setTimeSinceUpdate(Math.floor((Date.now() - lastUpdated) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    const fetchPrices = async () => {
      setIsRefreshing(true);
      try {
        const res = await axios.get('http://localhost:5000/price', {
          headers: getAuthHeaders()
        });

        if (res.data?.bitcoin && res.data?.ethereum) {
          setPrice(res.data);
        } else {
          console.warn('Unexpected response from API:', res.data);
        }
      } catch (err) {
        console.error('Error fetching /price:', err.response?.data || err.message);
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [getAuthHeaders]);

  return (
    <div className="w-full h-full">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100">
        <h2 className="text-2xl font-semibold mb-4">Live Prices</h2>

        {/* Timestamp and refresh status */}
        <div className="text-sm text-slate-400 mb-3">
          {isRefreshing ? (
            <span className="animate-spin inline-block mr-1">🔄</span>
          ) : (
            <span>Last updated {lastUpdated ? timeSinceUpdate : '?'}s ago</span>
          )}
          {lastUpdated && Date.now() - lastUpdated > 30000 && (
            <div className="text-red-400 text-xs mt-1">
              Data is over 30 seconds old. Check your network or API limits.
            </div>
          )}
        </div>

        {/* Price Data */}
        {price?.bitcoin?.usd && price?.ethereum?.usd ? (
          <>
            <p className="text-lg text-slate-200 mb-2">
              <span className="font-semibold text-amber-400">Bitcoin (BTC):</span>{' '}
              ${price.bitcoin.usd}
            </p>
            <p className="text-lg text-slate-200">
              <span className="font-semibold text-blue-400">Ethereum (ETH):</span>{' '}
              ${price.ethereum.usd}
            </p>
          </>
        ) : price ? (
          <p className="text-red-400 italic">API rate limit exceeded or data unavailable.</p>
        ) : (
          <p className="text-slate-400 italic">Loading...</p>
        )}
      </div>
    </div>
  );
}
