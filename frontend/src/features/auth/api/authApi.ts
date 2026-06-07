import { api } from "@/shared/api/api";
import type { AppUser } from "@/shared/types";

export type SellerOption = Extract<AppUser, { role: "seller" }> & {
  auctionCount: number;
  recentAuctions: Array<{
    productName: string;
    status: string;
  }>;
};

const authApi = {
  createGuestUser: (role: "seller" | "buyer") => {
    return api.post<AppUser>("/users/guest", { role });
  },

  getUser: (id: string) => {
    return api.get<AppUser>(`/users/${id}`);
  },

  listSellers: () => {
    return api.get<SellerOption[]>("/users/sellers");
  },
}

export default authApi;
