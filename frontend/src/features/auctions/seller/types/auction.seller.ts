import type { BaseAuction } from "@/features/auctions/types/auction";

export interface SellerAuction extends BaseAuction {
    sellerId: string;
    startingBid: number;
    incrementValue: number;
    buyOutPrice: number;
    timesBidded: number;
    baseDuration: number;
    extendedDuration?: {
        trigger: number;
        secondsAdded: number;
    };
}