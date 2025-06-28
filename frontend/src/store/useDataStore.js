import { create } from 'zustand';

const useDataStore = create((set) => ({
  price: null,
  lastUpdated: null, // ⬅️ new
  predict: null,
  sentiment: null,
  setPrice: (data) => set({ price: data, lastUpdated: Date.now() }), // ⬅️ updated
  setPredict: (data) => set({ predict: data }),
  setSentiment: (data) => set({ sentiment: data }),
}));

export default useDataStore;
