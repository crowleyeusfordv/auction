import type { BuyerAuction } from "../buyer/types/auction.buyer";
import type { SellerAuction } from "../seller/types/auction.seller";

export type { BuyerAuction, SellerAuction };


export type AuctionStatus = "not started" | "not_started" | "on going" | "on_going" | "cancelled" | "completed" | "ongoing" | "upcoming" | "ended";

export interface BaseAuction {
  id: string;
  productName?: string;
  product_name?: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  currentBid?: number;
  starting_bid?: number;
  status: AuctionStatus;
  scheduledTimeToStart?: string;
  scheduled_time_to_start?: string;
  seller_id?: string;
}

export type Auction = SellerAuction | BuyerAuction;

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
