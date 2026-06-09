import { api } from "@/shared/api/api";
import type { AppUser } from "@/shared/types";

const authApi = {
  createGuestUser: (role: "seller" | "buyer") => {
    return api.post<AppUser>("/users/guest", { role });
  },

  getUser: (id: string) => {
    return api.get<AppUser>(`/users/${id}`);
  },
}

export default authApi;
