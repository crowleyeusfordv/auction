
export type AuctionStatus = "not_started" | "on_going" | "cancelled" | "completed";

export interface Auction {
  id: string;
  sellerId: string;
  productName: string;
  incrementValue: number;
  status: AuctionStatus;
  startedAt?: string;
  endedAt?: string;
  currentBid?: number;
  timesBidded: number;
  startingBid?: number;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  buyOutPrice?: number;
  baseDuration?: number;
  scheduledTimeToStart?: string;
  isExtendedDuration?: boolean;
  triggerSeconds?: number;
  secondsExtended?: number;
}

export interface UserBid {
  id: string;
  amount: number;
  createdAt: string;
}

export interface ParticipatedAuction {
  auctionId: string;
  productName: string;
  imageUrl?: string;
  videoUrl?: string;
  status: AuctionStatus;
  highestBid: number;
  userBids: UserBid[];
}

export interface Order {
  id: string;
  productName: string;
  productImage?: string;
  winnerName: string;
  dateSold: string;
  price: number;
}
