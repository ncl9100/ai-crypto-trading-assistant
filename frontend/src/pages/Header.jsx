import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

export default function Header() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/price', label: 'Price' },
    { path: '/predict', label: 'Predict' },
    { path: '/sentiment', label: 'Sentiment' },
    { path: '/historical', label: 'Historical' },
    { path: '/recommendation', label: 'Recommendation' },
  ];

  return (
    <header className="bg-slate-800 shadow border-b border-slate-700 relative">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center relative">
        {/* Centered navigation */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center h-full">
          {/* Empty div for spacing, or put a logo here if you want */}
        </div>
        <div className="flex gap-6 mx-auto">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`transition duration-150 hover:text-blue-400 ${
                pathname === path ? 'text-blue-400 font-semibold' : ''
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        {/* User info and logout on the right */}
        {user && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <FaUser className="h-4 w-4" />
              <span className="text-sm">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1 text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              <FaSignOutAlt className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
