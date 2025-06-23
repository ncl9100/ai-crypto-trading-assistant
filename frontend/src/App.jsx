import { Routes, Route } from 'react-router-dom';
import DashboardShell from './pages/DashboardShell.jsx';
import Price from './pages/Price.jsx';
import Predict from './pages/Predict.jsx';
import Sentiment from './pages/Sentiment.jsx';

function App() {
  return (
    <DashboardShell>
      <Routes>
        <Route
          path="/"
          element={
            <h1 className="text-blue-600 text-4xl font-semibold text-center mt-8">
              React + Flask
            </h1>
          }
        />
        <Route path="/price" element={<Price />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/sentiment" element={<Sentiment />} />
      </Routes>
    </DashboardShell>
  );
}

export default App;
