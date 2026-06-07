import { useCallback, useState } from 'react';
import type { Auction } from '../types/auction';

type ModalType = 'create' | 'edit' | 'cancel' | null;

export function useAuctionModals() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  const openCreate = useCallback(() => {
    setSelectedAuction(null);
    setActiveModal('create');
  }, []);

  const openEdit = useCallback((auction: Auction) => {
    setSelectedAuction(auction);
    setActiveModal('edit');
  }, []);

  const openCancel = useCallback((auction: Auction) => {
    setSelectedAuction(auction);
    setActiveModal('cancel');
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedAuction(null);
  }, []);

  return {
    activeModal,
    selectedAuction,
    openCreate,
    openEdit,
    openCancel,
    closeModal,
  };
}
