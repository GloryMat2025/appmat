import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useTheme from "../hooks/useTheme";
import { Link } from "react-router-dom";
import useCart from "../hooks/useCart";

const { cartItems } = useCart();
<Link to="/cart" className="relative">
  🛒
  {cartItems.length > 0 && (
    <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs text-black rounded-full px-2 py-0.5">
      {cartItems.length}
    </span>
  )}
</Link>

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-blue-600 dark:bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-md relative">
      <h1 className="text-xl font-semibold">AppMat</h1>

      <div className="hidden md:flex items-center space-x-4">
        <a href="#home" className="hover:underline">Home</a>
        <a href="#menu" className="hover:underline">Menu</a>
        <a href="#contact" className="hover:underline">Contact</a>
        <a href="/admin" className="hover:underline">Admin</a>


        {/* Toggle Dark Mode */}
        <button
          onClick={toggleTheme}
          className="ml-4 bg-yellow-400 text-black px-2 py-1 rounded-full hover:bg-yellow-300 transition"
        >
          {theme === "dark" ? "🌙" : "🌞"}
        </button>
      </div>

      {/* Mobile button & dropdown sama macam sebelum ni */}
    </nav>
  );
}
