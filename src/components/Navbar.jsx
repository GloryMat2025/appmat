import { useState } from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import useCart from '../hooks/useCart';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { cartItems } = useCart();

  return (
    <nav className="bg-blue-600 dark:bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-md relative">
      <h1 className="text-xl font-semibold">AppMat</h1>

      <div className="hidden md:flex items-center space-x-4">
        <a href="#home" className="hover:underline">
          Home
        </a>
        <a href="#menu" className="hover:underline">
          Menu
        </a>
        <a href="#contact" className="hover:underline">
          Contact
        </a>
        <Link to="/admin" className="hover:underline">
          Admin
        </Link>

        <Link to="/cart" className="relative">
          🛒
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs text-black rounded-full px-2 py-0.5">
              {cartItems.length}
            </span>
          )}
        </Link>

        <button
          onClick={toggleTheme}
          className="ml-4 bg-yellow-400 text-black px-2 py-1 rounded-full hover:bg-yellow-300 transition"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden bg-yellow-400 text-black px-2 py-1 rounded-full"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      {menuOpen && (
        <div className="absolute top-16 right-4 bg-white dark:bg-gray-800 text-black dark:text-white p-4 rounded shadow-md md:hidden space-y-2">
          <a href="#home" className="block">
            Home
          </a>
          <a href="#menu" className="block">
            Menu
          </a>
          <a href="#contact" className="block">
            Contact
          </a>
          <Link to="/cart" className="block">
            Cart ({cartItems.length})
          </Link>
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
