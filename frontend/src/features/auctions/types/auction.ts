import type { BuyerAuction } from "../buyer/types/auction.buyer";
import type { SellerAuction } from "../seller/types/auction.seller";


export type AuctionStatus = "not started" | "on going" | "cancelled" | "completed" | "ongoing" | "upcoming" | "ended";

export interface BaseAuction {
  id: string;
  productName: string;
  description?: string;
  imageUrl?: string;
  currentBid: number;
  status: AuctionStatus;
  scheduledTimeToStart?: string;
}

export type Auction = SellerAuction | BuyerAuction;

export interface Order {
  id: string;
  productName: string;
  productImage?: string;
  winnerName: string;
  dateSold: string;
  price: number;
}
