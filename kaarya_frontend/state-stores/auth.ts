import { create } from "zustand";
import { TUser } from "@/lib/definitions";

type AuthStore = {
  user: TUser | null;
  isAuthenticated: boolean;

  setUser: (user: TUser | null) => void;
  setIsAuthenticated: (value: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
}));
