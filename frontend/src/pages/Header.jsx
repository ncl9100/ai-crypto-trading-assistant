import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

export default function Header() { // exporting makes it available for import in other files
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/price', label: 'Price' },
    { path: '/predict', label: 'Predict' },
    { path: '/sentiment', label: 'Sentiment' },
    { path: '/historical', label: 'Historical' },
  ];

  return (
    <header className="bg-slate-800 shadow border-b border-slate-700">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center text-sm font-medium text-slate-300">
        <div className="flex gap-6">
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
        
        {user && (
          <div className="flex items-center gap-4">
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
