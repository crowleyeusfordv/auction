export const ROUTES = {
  HOME: '/',
  BUYER: {
    ROOT: '/buyer',
    BIDS: '/buyer/bids',
  },
  SELLER: {
    ROOT: '/seller',
    AUCTIONS: '/seller/auctions',
    ORDERS: '/seller/orders',
  },
  AUCTIONS: {
    ROOT: '/auctions',
    RULES: "/auctions/rules",
    LIVE_ROOM: "/auctions/:auction_id/live-room",
    LIVE_ROOM_DYNAMIC_PATH: (auction_id: string) => `/auctions/${auction_id}/live-room`,
    PAYMENT: "/auctions/:auction_id/payment",
    PAYMENT_DYNAMIC_PATH: (auction_id: string) => `/auctions/${auction_id}/payment`,

  }
} as const;
