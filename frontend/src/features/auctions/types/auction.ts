export type AuctionStatus = "not started" | "on going" | "cancelled" | "completed";

export interface Auction {
  id: string;
  sellerId: string;
  name: string;
  description?: string;
  image?: string;
  startingBid: number;
  fixedIncrement: number;
  highestBid: number;
  currentBid: number;
  timesBidded: number;
  status: AuctionStatus;
  baseDuration: number;
  extendedDuration?: {
    trigger: number;
    secondsAdded: number;
  };
  startTime: string; // ISO string
}

export interface Order {
  id: string;
  productName: string;
  productImage?: string;
  winnerName: string;
  dateSold: string;
  price: number;
}
