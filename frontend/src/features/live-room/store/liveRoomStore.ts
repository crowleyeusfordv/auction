import { create } from 'zustand';

export interface Ranker {
  userId: string;
  username: string;
  bidAmount: number;
  position: number;
}

export interface RoomState {
  currentBid: {
    bidderId: string | null;
    bidderName: string | null;
    amount: number;
    timestamp: string | null;
  };
  incrementValue: number;
  buyOutPrice: number | null;
  ranking: Ranker[];
  userPosition: number | null;
  userAmount: number | null;
  viewerCount: number;
  timer: {
    remainingMs: number;
    serverTime: string | null;
  };
  status: 'active' | 'ended' | 'cancelled';
  winner: {
    id: string;
    name: string;
    amount: number;
  } | null;
  cancelReason: string | null;
  cancelResult: {
    winnerId: string | null;
    finalAmount: number;
    auctionName: string;
    imageUrl: string;
  } | null;
  extensionNotice: {
    remainingMs: number;
    timestamp: number;
  } | null;
}

const DEFAULT_ROOM_STATE: RoomState = {
  currentBid: { bidderId: null, bidderName: null, amount: 0, timestamp: null },
  incrementValue: 10,
  buyOutPrice: null,
  ranking: [],
  userPosition: null,
  userAmount: null,
  viewerCount: 0,
  timer: { remainingMs: 0, serverTime: null },
  status: 'active',
  winner: null,
  cancelReason: null,
  cancelResult: null,
  extensionNotice: null,
};

interface LiveRoomStore {
  rooms: Record<string, RoomState>;

  // Actions
  initRoom: (auctionId: string) => void;
  setRoomState: (auctionId: string, payload: Partial<RoomState>) => void;
  setNewBid: (auctionId: string, bid: RoomState['currentBid']) => void;
  setRankingUpdate: (auctionId: string, ranking: Ranker[], userPosition: number | null, userAmount: number | null) => void;
  setTimerSync: (auctionId: string, remainingMs: number, serverTime: string | null) => void;
  setTimerExtended: (auctionId: string, remainingMs: number) => void;
  setViewerCount: (auctionId: string, count: number) => void;
  setAuctionEnded: (auctionId: string, winnerId: string, winnerName: string, finalAmount: number) => void;
  setAuctionCancelled: (
    auctionId: string,
    reason: string,
    result?: {
      winnerId: string | null;
      finalAmount: number;
      auctionName: string;
      imageUrl: string;
    }
  ) => void;
}

export const useLiveRoomStore = create<LiveRoomStore>((set) => ({
  rooms: {},

  initRoom: (auctionId) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: state.rooms[auctionId] || { ...DEFAULT_ROOM_STATE }
    }
  })),

  setRoomState: (auctionId, payload) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        ...payload
      }
    }
  })),

  setNewBid: (auctionId, bid) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        currentBid: bid
      }
    }
  })),

  setRankingUpdate: (auctionId, ranking, userPosition, userAmount) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        ranking,
        userPosition,
        userAmount
      }
    }
  })),

  setTimerSync: (auctionId, remainingMs, serverTime) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        timer: { remainingMs, serverTime }
      }
    }
  })),

  setViewerCount: (auctionId, count) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        viewerCount: count
      }
    }
  })),

  setAuctionEnded: (auctionId, id, name, amount) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        status: 'ended',
        winner: { id, name, amount }
      }
    }
  })),

  setAuctionCancelled: (auctionId, reason, result) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        status: 'cancelled',
        cancelReason: reason,
        cancelResult: result || null
      }
    }
  })),

  setTimerExtended: (auctionId, remainingMs) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        timer: { remainingMs, serverTime: null },
        extensionNotice: {
          remainingMs,
          timestamp: Date.now(),
        }
      }
    }
  })),
}));
