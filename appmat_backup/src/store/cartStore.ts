import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  clear: () => void;
  total: () => number;
}

const persisted = JSON.parse(localStorage.getItem("appmat_cart") || "[]");

export const useCartStore = create<CartState>((set, get) => ({
  items: persisted,

  add: (item) =>
    set((state) => {
      const exist = state.items.find((i) => i.id === item.id);
      let updated;

      if (exist) {
        updated = state.items.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        updated = [...state.items, { ...item, qty: 1 }];
      }

      localStorage.setItem("appmat_cart", JSON.stringify(updated));
      return { items: updated };
    }),

  remove: (id) =>
    set((state) => {
      const updated = state.items.filter((i) => i.id !== id);
      localStorage.setItem("appmat_cart", JSON.stringify(updated));
      return { items: updated };
    }),

  increase: (id) =>
    set((state) => {
      const updated = state.items.map((i) =>
        i.id === id ? { ...i, qty: i.qty + 1 } : i
      );
      localStorage.setItem("appmat_cart", JSON.stringify(updated));
      return { items: updated };
    }),

  decrease: (id) =>
    set((state) => {
      let updated = state.items.map((i) =>
        i.id === id ? { ...i, qty: i.qty - 1 } : i
      );

      updated = updated.filter((i) => i.qty > 0);
      localStorage.setItem("appmat_cart", JSON.stringify(updated));
      return { items: updated };
    }),

  clear: () => {
    localStorage.removeItem("appmat_cart");
    set({ items: [] });
  },

  total: () => {
    return get().items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }
}));
