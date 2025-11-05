import { useState } from 'react';
import useTheme from '../hooks/useTheme';
import { Link } from 'react-router-dom';
import useCart from '../hooks/useCart';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { cartItems } = useCart();

  return (
    <nav className="bg-blue-600 dark:bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-md relative">
      <h1 className="text-xl font-semibold">AppMat</h1>

      {/* Desktop Menu */}
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
        <a href="/admin" className="hover:underline">
          Admin
        </a>

        {/* Cart Button */}
        <Link to="/cart" className="relative">
          🛒
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs text-black rounded-full px-2 py-0.5">
              {cartItems.length}
            </span>
          )}
        </Link>

        {/* Toggle Dark Mode */}
        <button
          onClick={toggleTheme}
          className="ml-4 bg-yellow-400 text-black px-2 py-1 rounded-full hover:bg-yellow-300 transition"
        >
          {theme === 'dark' ? '🌙' : '🌞'}
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute top-14 left-0 w-full bg-blue-700 dark:bg-gray-800 flex flex-col space-y-2 py-3 px-4 md:hidden">
          <a href="#home" className="hover:underline">
            Home
          </a>
          <a href="#menu" className="hover:underline">
            Menu
          </a>
          <a href="#contact" className="hover:underline">
            Contact
          </a>
          <a href="/admin" className="hover:underline">
            Admin
          </a>
          <Link to="/cart">🛒 Cart ({cartItems.length})</Link>
          <button
            onClick={toggleTheme}
            className="mt-2 bg-yellow-400 text-black px-2 py-1 rounded-full hover:bg-yellow-300 transition"
          >
            {theme === 'dark' ? '🌙 Dark' : '🌞 Light'}
          </button>
        </div>
      )}
    </nav>
  );
}
