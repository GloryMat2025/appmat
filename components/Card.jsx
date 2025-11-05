import { motion } from 'framer-motion';
import useCart from '../hooks/useCart';

export default function Card({ id, title, desc, price }) {
  const { addToCart } = useCart();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition"
    >
      <h2 className="font-semibold text-lg">{title}</h2>
      <p className="text-gray-600 dark:text-gray-300 mt-2">{desc}</p>
      <p className="mt-2 font-bold text-blue-600 dark:text-yellow-400">RM {price.toFixed(2)}</p>

      <button
        onClick={() => addToCart({ id, title, price })}
        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Add to Cart
      </button>
    </motion.div>
  );
}
