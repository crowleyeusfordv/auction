import type { BaseAuction } from "@/features/auctions/types/auction";

export interface BuyerAuction extends BaseAuction {
    sellerName?: string;
    myLastBid?: number;
    isWinning?: boolean;
}
