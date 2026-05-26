import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import authApi from "../api/createGuestUser";
import type { AppUser } from "@/shared/types/user";
import { userStorage } from "@/shared/store/userStorage";

export function useCreateGuest(role: "seller" | "buyer") {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => {
      const cached = userStorage.get(role);
      if (cached) return Promise.resolve(cached);
      return authApi.createGuestUser(role);
    },
    onSuccess: (data) => {
      const user: AppUser = { ...data, role };
      userStorage.set(user);
      navigate(`/${role}`);
    },
  });
}
