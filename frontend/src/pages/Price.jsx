import { useEffect, useState } from 'react';
import axios from 'axios';
import useDataStore from '../store/useDataStore';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

export default function Price() {
  const { price, setPrice, lastUpdated } = useDataStore(); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/price', {
          headers: getAuthHeaders()
        });

        if (res.data?.bitcoin && res.data?.ethereum) {
          setPrice(res.data);
        } else {
          toast.error('Unexpected response from API');
        }
      } catch (err) {
        toast.error('Failed to fetch live prices');
      } finally {
        setIsRefreshing(false);
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [getAuthHeaders, setPrice]);

  if (loading) {
    return <Spinner message="Loading live prices..." />;
  }

  return (
    <div className="w-full h-full">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full h-full text-center text-slate-100">
        <h2 className="text-2xl font-semibold mb-4">Live Prices</h2>
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
          <Spinner message="Loading live prices..." />
        )}
      </div>
    </div>
  );
}
