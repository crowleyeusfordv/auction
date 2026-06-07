import { create } from 'zustand';

interface NotificationStore {
  isResultModalOpen: boolean;
  requestedBidAuctionId: string | null;
  activeOutbidAuctionId: string | null;
  setResultModalOpen: (isOpen: boolean) => void;
  requestBidModal: (auctionId: string) => void;
  clearBidModalRequest: () => void;
  setActiveOutbidAuctionId: (auctionId: string | null) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  isResultModalOpen: false,
  requestedBidAuctionId: null,
  activeOutbidAuctionId: null,
  setResultModalOpen: (isOpen) => set({ isResultModalOpen: isOpen }),
  requestBidModal: (auctionId) => set({ requestedBidAuctionId: auctionId }),
  clearBidModalRequest: () => set({ requestedBidAuctionId: null }),
  setActiveOutbidAuctionId: (auctionId) => set({ activeOutbidAuctionId: auctionId }),
}));
