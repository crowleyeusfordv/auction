import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import authApi from "../api/authApi";
import type { AppUser } from "@/shared/types/user";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { ROUTES } from "@/shared/constants/routes";

export function useCreateGuest(role: "seller" | "buyer") {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const { user, buyerUser, sellerUser } = useAuthStore.getState();
      const roleUser = role === "buyer" ? buyerUser : sellerUser;

      const cachedUser = roleUser?.role === role ? roleUser : user?.role === role ? user : null;
      if (cachedUser) {
        try {
          const verifiedUser = await authApi.getUser(cachedUser.id);
          return { ...verifiedUser, role };
        } catch {
          // Cached session may point to a deleted/reset user, create a fresh guest instead.
        }
      }

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
