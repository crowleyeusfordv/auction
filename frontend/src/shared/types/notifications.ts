export interface OutbidPayload {
  auctionId: string;
  auctionName: string;
  imageUrl: string;
  newAmount: number;
  yourPosition: number;
}

export interface AuctionWonPayload {
  auctionId: string;
  auctionName: string;
  imageUrl: string;
  finalAmount: number;
  orderId: string;
}

export interface AuctionLostPayload {
  auctionId: string;
  auctionName: string;
  imageUrl: string;
  finalAmount?: number;
  cancelled?: boolean;
  didLead?: boolean;
  reason?: string;
}

export interface AuctionCancelledPayload {
  auctionId: string;
  auctionName: string;
  imageUrl: string;
  reason: string;
}

export type UserNotification =
  | { type: "outbid"; payload: OutbidPayload }
  | { type: "auction_won"; payload: AuctionWonPayload }
  | { type: "auction_lost"; payload: AuctionLostPayload }
  | { type: "auction_cancelled_won"; payload: AuctionCancelledPayload }
  | { type: "auction_cancelled_lost"; payload: AuctionCancelledPayload };


export type UserWsMessage =
  | UserNotification
  | { type: "pending_notifications"; payload: UserNotification[] };


export interface HeartbeatMessage {
  type: "heartbeat";
}
