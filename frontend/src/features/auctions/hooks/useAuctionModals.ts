import { useCallback, useState } from 'react';
import type { SellerAuction } from '../seller/types/auction.seller';

type ModalType = 'create' | 'edit' | 'cancel' | null;

export function useAuctionModals() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedAuction, setSelectedAuction] = useState<SellerAuction | null>(null);

  const openCreate = useCallback(() => {
    setSelectedAuction(null);
    setActiveModal('create');
  }, []);

  const openEdit = useCallback((auction: SellerAuction) => {
    setSelectedAuction(auction);
    setActiveModal('edit');
  }, []);

  const openCancel = useCallback((auction: SellerAuction) => {
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
