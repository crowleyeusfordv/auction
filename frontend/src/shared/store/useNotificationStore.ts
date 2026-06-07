import { create } from 'zustand';

interface NotificationStore {
  isResultModalOpen: boolean;
  setResultModalOpen: (isOpen: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  isResultModalOpen: false,
  setResultModalOpen: (isOpen) => set({ isResultModalOpen: isOpen }),
}));
