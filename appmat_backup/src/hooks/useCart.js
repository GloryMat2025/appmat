import { useCartContext } from '../context/CartContext';

export default function useCart() {
  // Return the entire cart context so callers can access all helpers (including clearCart)
  return useCartContext();
}
