import useCart from '../hooks/useCart';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

<Link to="/checkout">
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
  >
    Teruskan ke Checkout
  </motion.button>
</Link>;

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();

  return (
    <section id="cart" className="py-16 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-700 dark:text-yellow-400">
          Troli Belian Anda 🛒
        </h2>

        {cartItems.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-300">
            Troli kosong. Tambah produk dahulu!
          </p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4"
              >
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">
                    RM {item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-3 text-red-600 hover:text-red-400"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}

            <div className="text-right pt-4">
              <h4 className="text-lg font-semibold">
                Jumlah:{' '}
                <span className="text-blue-700 dark:text-yellow-400">
                  RM {totalPrice.toFixed(2)}
                </span>
              </h4>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
              >
                Checkout Sekarang
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
