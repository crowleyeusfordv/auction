import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auctionsApi } from "../api/auctionsApi";
import type { UpdateAuctionPayload } from "../api/auctionsApi";

export function useGetAuctions(queryParameters: { seller_id: string } & Record<string, string>) {
  return useQuery({
    queryKey: ["auctions", queryParameters],
    queryFn: () => auctionsApi.getAuctions(queryParameters),
    refetchInterval: 5000,
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auctionsApi.createAuction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
  });
}

export function useUpdateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateAuctionPayload }) =>
      auctionsApi.updateAuction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auctionsApi.cancelAuction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
  });
}

export function useSellerOrders(sellerId: string) {
  return useQuery({
    queryKey: ["sellerOrders", sellerId],
    queryFn: () => auctionsApi.getOrdersBySeller(sellerId),
  });
}

export function useGetParticipatedAuctions(userId: string) {
  return useQuery({
    queryKey: ["participatedAuctions", userId],
    queryFn: () => auctionsApi.getParticipatedAuctions(userId),
    enabled: !!userId,
  });
}
