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
  finalAmount: number;
}

export type UserNotification =
  | { type: "outbid"; payload: OutbidPayload }
  | { type: "auction_won"; payload: AuctionWonPayload }
  | { type: "auction_lost"; payload: AuctionLostPayload };


export type UserWsMessage =
  | UserNotification
  | { type: "pending_notifications"; payload: UserNotification[] };


export interface HeartbeatMessage {
  type: "heartbeat";
}
