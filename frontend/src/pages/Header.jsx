import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaUser, FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/price', label: 'Price' },
    { path: '/predict', label: 'Predict' },
    { path: '/sentiment', label: 'Sentiment' },
    { path: '/historical', label: 'Historical' },
    { path: '/recommendation', label: 'Recommendation' },
  ];

  // Close menu on navigation
  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className="bg-slate-800 shadow border-b border-slate-700 relative z-20">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
        {/* Logo or Brand */}
        <div className="text-xl font-bold text-indigo-400">CryptoAI</div>

        {/* Hamburger Icon (mobile only) */}
        <button
          className="sm:hidden text-slate-200 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open navigation menu"
        >
          {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center flex-1 justify-center">
          <div className="flex flex-row gap-6">
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
        </div>

        {/* Desktop User Info & Logout */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 ml-6">
            <span className="flex items-center text-gray-300 text-sm">
              <FaUser className="w-4 h-4 mr-1" />
              {user.email}
            </span>
            <button
              onClick={logout}
              className="flex items-center text-red-400 hover:text-red-600 text-sm font-semibold"
            >
              <FaSignOutAlt className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        {menuOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            />
            {/* Sidebar Drawer */}
            <div
              className="fixed top-0 left-0 h-full w-4/5 max-w-xs bg-slate-800 shadow-xl z-50 flex flex-col p-6 transition-transform duration-200"
              onClick={(e) => e.stopPropagation()}
              style={{ minWidth: 220 }}
            >
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={handleNavClick}
                    className={`transition duration-150 hover:text-blue-400 text-lg ${
                      pathname === path ? 'text-blue-400 font-semibold' : ''
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              {user && (
                <div className="flex flex-col gap-2 mt-8 border-t border-slate-700 pt-6">
                  <span className="flex items-center text-gray-300 text-base">
                    <FaUser className="w-5 h-5 mr-2" />
                    {user.email}
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center text-red-400 hover:text-red-600 text-base font-semibold"
                  >
                    <FaSignOutAlt className="w-5 h-5 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
