import { create } from 'zustand';

const useDataStore = create((set) => ({
  price: null,
  predict: null,
  sentiment: null,
  setPrice: (data) => set({ price: data }),
  setPredict: (data) => set({ predict: data }),
  setSentiment: (data) => set({ sentiment: data }),
}));

export default useDataStore;
