import { useCartContext } from '../context/CartContext';

export default function useCart() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, totalPrice } = useCartContext();
  return { cartItems, addToCart, removeFromCart, updateQuantity, totalPrice };
}
