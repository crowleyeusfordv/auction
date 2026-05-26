import { api } from "@/shared/services/api";
import type { GuestUser } from "../types/user";

const authApi = {
  createGuestUser: (role: "seller" | "buyer") => {
    return api.post<GuestUser>("/users/guest", { role });
  }
}

export default authApi;
