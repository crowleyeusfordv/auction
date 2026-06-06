import { api } from "@/shared/api/api";
import type { AppUser } from "@/shared/types";

const authApi = {
  createGuestUser: (role: "seller" | "buyer") => {
    return api.post<AppUser>("/users/guest", { role });
  }
}

export default authApi;
