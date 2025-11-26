import { create } from "zustand";
import { login, logout, signup, getProfile } from "@/services/users";

interface UserState {
  user: any | null;
  loading: boolean;
  loadUser: () => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  signupUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,

  loadUser: async () => {
    set({ loading: true });
    const user = await getProfile();
    set({ user, loading: false });
  },

  loginUser: async (email, password) => {
    set({ loading: true });
    await login(email, password);
    const user = await getProfile();
    set({ user, loading: false });
  },

  signupUser: async (email, password) => {
    set({ loading: true });
    await signup(email, password);
    const user = await getProfile();
    set({ user, loading: false });
  },

  logoutUser: async () => {
    await logout();
    set({ user: null });
  }
}));
