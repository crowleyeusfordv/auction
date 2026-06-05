import { create } from 'zustand';
import type { Ranker } from '../components/RankingModal';

export interface RoomState {
  currentBid: {
    bidderId: string | null;
    bidderName: string | null;
    amount: number;
    timestamp: string | null;
  };
  incrementValue: number;
  ranking: Ranker[];
  userPosition: number | null;
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
}

const DEFAULT_ROOM_STATE: RoomState = {
  currentBid: { bidderId: null, bidderName: null, amount: 0, timestamp: null },
  incrementValue: 10,
  ranking: [],
  userPosition: null,
  viewerCount: 0,
  timer: { remainingMs: 0, serverTime: null },
  status: 'active',
  winner: null,
  cancelReason: null,
};

interface LiveRoomStore {
  rooms: Record<string, RoomState>;

  // Actions
  initRoom: (auctionId: string) => void;
  setRoomState: (auctionId: string, payload: Partial<RoomState>) => void;
  setNewBid: (auctionId: string, bid: RoomState['currentBid']) => void;
  setRankingUpdate: (auctionId: string, ranking: Ranker[], userPosition: number) => void;
  setTimerSync: (auctionId: string, remainingMs: number, serverTime: string) => void;
  setViewerCount: (auctionId: string, count: number) => void;
  setAuctionEnded: (auctionId: string, winnerId: string, winnerName: string, finalAmount: number) => void;
  setAuctionCancelled: (auctionId: string, reason: string) => void;
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

  setRankingUpdate: (auctionId, ranking, userPosition) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        ranking,
        userPosition
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

  setAuctionCancelled: (auctionId, reason) => set((state) => ({
    rooms: {
      ...state.rooms,
      [auctionId]: {
        ...(state.rooms[auctionId] || DEFAULT_ROOM_STATE),
        status: 'cancelled',
        cancelReason: reason
      }
    }
  })),
}));
