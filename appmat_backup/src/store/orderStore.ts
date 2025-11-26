import { create } from "zustand";
import { createOrder, getOrders, getOrderDetail } from "@/services/orders";

interface OrderState {
  orders: any[];
  selectedOrder: any | null;
  loading: boolean;

  loadOrders: (userId: string) => Promise<void>;
  loadOrderDetail: (orderId: string) => Promise<void>;
  createNewOrder: (userId: string, items: any[]) => Promise<any>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  selectedOrder: null,
  loading: false,

  loadOrders: async (userId) => {
    set({ loading: true });
    const list = await getOrders(userId);
    set({ orders: list, loading: false });
  },

  loadOrderDetail: async (orderId) => {
    set({ loading: true });
    const detail = await getOrderDetail(orderId);
    set({ selectedOrder: detail, loading: false });
  },

  createNewOrder: async (userId, items) => {
    set({ loading: true });
    const res = await createOrder(userId, items);
    set({ loading: false });
    return res;
  }
}));
