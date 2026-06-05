import mapQueryParameters from "@/shared/utils/mapQueryParameters";
import { api } from "../../../shared/api/api";
import type { Auction, Order, ParticipatedAuction } from "../types/auction";

export type CreateAuctionPayload = Omit<Auction, "id" | "status" | "currentBid" | "timesBidded">;
export type UpdateAuctionPayload = Partial<Omit<Auction, "id" | "sellerId">>;

export const auctionsApi = {
  getAuctions: (queryParameters: Record<string, string>) => {
    const endpoint = mapQueryParameters("/auctions", queryParameters);
    return api.get<Auction[]>(endpoint);
  },

  createAuction: (auction: CreateAuctionPayload) =>
    api.post<Auction>("/auctions", auction),

  updateAuction: (id: string, updates: UpdateAuctionPayload) =>
    api.put<Auction>(`/auctions/${id}`, updates),

  cancelAuction: (id: string) =>
    api.patch<Auction>(`/auctions/${id}/status`, { status: "cancelled" }),

  getOrdersBySeller: (sellerId: string) =>
    api.get<Order[]>(`/sellers/${sellerId}/orders`),

  getParticipatedAuctions: (userId: string) =>
    api.get<ParticipatedAuction[]>(`/bids?user_id=${userId}`),
};

