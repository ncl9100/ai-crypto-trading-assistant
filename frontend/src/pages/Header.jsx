import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { pathname } = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/price', label: 'Price' },
    { path: '/predict', label: 'Predict' },
    { path: '/sentiment', label: 'Sentiment' },
  ];

  return (
    <header className="bg-slate-800 shadow border-b border-slate-700">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-center gap-6 text-sm font-medium text-slate-300">
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
      </nav>
    </header>
  );
}
