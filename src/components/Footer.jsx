import { motion } from "framer-motion";
import useCart from "../hooks/useCart";
const { cartItems, totalPrice } = useCart();
<span className="ml-3 bg-yellow-400 text-black px-2 py-1 rounded-full">
  🛒 {cartItems.length} | RM {totalPrice.toFixed(2)}
</span>
export default function Footer() {
  return (
    <footer className="bg-blue-700 text-white py-6 mt-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-sm"
        >
          © {new Date().getFullYear()} <span className="font-semibold">AppMat</span>. All rights reserved.
        </motion.p>

        <div className="flex space-x-5">
          <a href="https://facebook.com" target="_blank" className="hover:text-yellow-300 transition">
            <i className="fa-brands fa-facebook-f"></i>
          </a>
          <a href="https://instagram.com" target="_blank" className="hover:text-yellow-300 transition">
            <i className="fa-brands fa-instagram"></i>
          </a>
          <a href="https://wa.me/60123456789" target="_blank" className="hover:text-yellow-300 transition">
            <i className="fa-brands fa-whatsapp"></i>
          </a>
          
        </div>
      </div>
    </footer>
  );
}
