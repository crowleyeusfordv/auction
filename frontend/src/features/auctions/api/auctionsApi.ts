import { api } from "../../../shared/services/api";
import type { Auction, Order } from "../types/auction";

export type CreateAuctionPayload = Omit<Auction, "id" | "status" | "currentBid" | "timesBidded">;
export type UpdateAuctionPayload = Partial<Omit<Auction, "id" | "sellerId">>;

export const auctionsApi = {
  getAuctionsBySeller: (sellerId: string) =>
    api.get<Auction[]>(`/sellers/${sellerId}/auctions`),

  createAuction: (auction: CreateAuctionPayload) =>
    api.post<Auction>("/auctions", auction),

  updateAuction: (id: string, updates: UpdateAuctionPayload) =>
    api.patch<Auction>(`/auctions/${id}`, updates),

  cancelAuction: (id: string) =>
    api.patch<Auction>(`/auctions/${id}`, { status: "cancelled" }),

  getOrdersBySeller: (sellerId: string) =>
    api.get<Order[]>(`/sellers/${sellerId}/orders`),
};

