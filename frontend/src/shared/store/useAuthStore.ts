import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "../types/user";

interface AuthState {
  user: AppUser | null;
  buyerUser: AppUser | null;
  sellerUser: AppUser | null;
  setUser: (user: AppUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      buyerUser: null,
      sellerUser: null,
      setUser: (user) => set((state) => {
        if (!user) {
          return { user: null };
        }

        if (user.role === "buyer") {
          return {
            user,
            buyerUser: user,
            sellerUser: state.sellerUser ?? (state.user?.role === "seller" ? state.user : null),
          };
        }

        return {
          user,
          buyerUser: state.buyerUser ?? (state.user?.role === "buyer" ? state.user : null),
          sellerUser: user,
        };
      }),
    }),
    {
      name: "AUTH-STORE",
    },
  ),
);
