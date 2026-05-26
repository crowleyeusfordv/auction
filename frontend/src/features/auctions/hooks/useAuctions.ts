import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auctionsApi } from "../api/auctionsApi";
import type { UpdateAuctionPayload } from "../api/auctionsApi";

export function useSellerAuctions(sellerId: string) {
  return useQuery({
    queryKey: ["sellerAuctions", sellerId],
    queryFn: () => auctionsApi.getAuctionsBySeller(sellerId),
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auctionsApi.createAuction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sellerAuctions", variables.sellerId] });
    },
  });
}

export function useUpdateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateAuctionPayload }) =>
      auctionsApi.updateAuction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerAuctions"] });
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auctionsApi.cancelAuction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerAuctions"] });
    },
  });
}

export function useSellerOrders(sellerId: string) {
  return useQuery({
    queryKey: ["sellerOrders", sellerId],
    queryFn: () => auctionsApi.getOrdersBySeller(sellerId),
  });
}
