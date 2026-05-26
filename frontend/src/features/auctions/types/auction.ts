export type AuctionStatus = "not started" | "on going" | "cancelled" | "completed";

export interface Auction {
  id: string;
  sellerId: string;
  productName: string;
  description?: string;
  imageUrl?: string;
  startingBid: number;
  incrementValue: number;
  buyOutPrice: number;
  currentBid: number;
  timesBidded: number;
  status: AuctionStatus;
  baseDuration: number;
  extendedDuration?: {
    trigger: number;
    secondsAdded: number;
  };
  scheduledTimeToStart: string; // ISO string
}

export interface Order {
  id: string;
  productName: string;
  productImage?: string;
  winnerName: string;
  dateSold: string;
  price: number;
}
