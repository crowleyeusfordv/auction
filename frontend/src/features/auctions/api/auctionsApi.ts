import { api } from "../../../shared/services/api";
import type { Auction, Order } from "../types/auction";

export type CreateAuctionPayload = Omit<Auction, "id" | "status" | "currentBid" | "timesBidded">;
export type UpdateAuctionPayload = Partial<Omit<Auction, "id" | "sellerId">>;

export const auctionsApi = {
  getAuctionsBySeller: (sellerId: string) =>
    api.get<Auction[]>(`/auctions?seller_id=${sellerId}`),

  createAuction: (auction: CreateAuctionPayload) =>
    api.post<Auction>("/auctions", auction),

  updateAuction: (id: string, updates: UpdateAuctionPayload) =>
    api.put<Auction>(`/auctions/${id}`, updates),

  cancelAuction: (id: string) =>
    api.patch<Auction>(`/auctions/${id}/status`, { status: "cancelled" }),

  getOrdersBySeller: (sellerId: string) =>
    api.get<Order[]>(`/sellers/${sellerId}/orders`),
};

