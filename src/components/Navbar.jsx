import { useState } from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import useCart from '../hooks/useCart';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { cartItems } = useCart();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Rewards', path: '/rewards' },
    { name: 'Cart', path: '/cart' },
    { name: 'Account', path: '/account' },
  ];

  return (
    <nav className="bg-blue-600 dark:bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-md relative">
      {/* Brand */}
      <h1 className="text-xl font-semibold tracking-wide">AppMat</h1>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center space-x-4">
        {links.map((link) => (
          <Link key={link.name} to={link.path} className="hover:underline">
            {link.name}
          </Link>
        ))}

        {/* Cart */}
        <Link to="/cart" className="relative">
          🛒
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs text-black rounded-full px-2 py-0.5">
              {cartItems.length}
            </span>
          )}
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="ml-4 bg-yellow-400 text-black px-2 py-1 rounded-full hover:bg-yellow-300 transition"
          title="Toggle theme"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden bg-yellow-400 text-black px-2 py-1 rounded-full"
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-16 right-4 bg-white dark:bg-gray-800 text-black dark:text-white p-4 rounded shadow-md md:hidden space-y-2 z-50">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="block hover:underline"
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="block w-full bg-yellow-400 text-black py-1 rounded"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>
      )}
    </nav>
  );
}
