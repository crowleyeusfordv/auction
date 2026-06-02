import { createContext, useContext } from 'react';

export const LiveRoomContext = createContext<string | null>(null);

export function useCurrentAuctionId() {
  const context = useContext(LiveRoomContext);
  if (!context) {
    throw new Error('useCurrentAuctionId must be used within a LiveRoomProvider');
  }
  return context;
}
