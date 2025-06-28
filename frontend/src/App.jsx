import { Routes, Route } from 'react-router-dom';
import DashboardShell from './pages/DashboardShell.jsx';
import Price from './pages/Price.jsx';
import Predict from './pages/Predict.jsx';
import Sentiment from './pages/Sentiment.jsx';
import { FaChartLine } from 'react-icons/fa'; // Icon for dashboard title

function App() {
  return (
    <DashboardShell>
      <Routes>
        <Route
          path="/"
          element={
            <div className="p-6 md:p-10 text-center text-slate-100">
              <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-2">
                <FaChartLine className="text-indigo-400" />
                Crypto Dashboard
              </h1>
              <p className="text-slate-400 mb-8 text-sm md:text-base">
                Your AI-powered assistant for real-time crypto insights
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center max-w-7xl mx-auto">
                <div className="w-full max-w-md min-h-[250px]">
                  <Price />
                </div>
                <div className="w-full max-w-md min-h-[250px]">
                  <Predict />
                </div>
                <div className="w-full max-w-md min-h-[250px]">
                  <Sentiment />
                </div>
              </div>
            </div>
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
