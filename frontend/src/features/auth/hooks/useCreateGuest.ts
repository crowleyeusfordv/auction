import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import authApi from "../api/createGuestUser";
import type { AppUser } from "@/shared/types/user";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { ROUTES } from "@/shared/constants/routes";

export function useCreateGuest(role: "seller" | "buyer") {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => {
      const { user } = useAuthStore.getState();
      if (user?.role === role) return Promise.resolve(user);
      return authApi.createGuestUser(role);
    },
    onSuccess: (data) => {
      const user: AppUser = { ...data, role };
      useAuthStore.getState().setUser(user);
      if (role === "buyer") {
        navigate(ROUTES.AUCTIONS.ROOT)
      }
      else if (role === "seller") {
        navigate(ROUTES.SELLER.ROOT);
      }
    },
  });
}
