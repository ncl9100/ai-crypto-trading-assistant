import { create } from 'zustand'; // Zustand is a small, fast state management library for React applications

const useDataStore = create((set) => ({ // Zustand creates a store that can be accessed by any component in the application
  price: null,
  lastUpdated: null, 
  predict: null,
  sentiment: null,
  setPrice: (data) => set({ price: data, lastUpdated: Date.now() }), // setPrice updates the price and lastUpdated state
  setPredict: (data) => set({ predict: data }),
  setSentiment: (data) => set({ sentiment: data }),
}));

export default useDataStore;

//state is data that changes over time - e.g. latest price, prediction, sentiment
//react uses state to keep track of data that changes over time, and rerenders the component when the state changes
//however, if multiple components need to access the same state, it can be difficult to manage
//zustand is a small, fast state management library for React applications
//it allows you to create a store that can be accessed by any component in the application
//e.g. if your price page and the home page need to access the same price data, you can use zustand to do this
//you can create a store using the create function from zustand, and pass it a function that takes set as an argument
//a store is a shared data hub

