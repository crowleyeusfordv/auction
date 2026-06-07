import { toast } from 'sonner';
import { BaseAuctionFormModal } from './BaseAuctionFormModal';
import { useUpdateAuction } from '../hooks/useAuctions';
import type { Auction } from '../types/auction';
import type { AuctionFormData } from '../schemas/auctionSchema';

interface EditAuctionModalProps {
  auction: Auction | null;
  sellerId: string;
  opened?: boolean;
  onClose: () => void;
}

export function EditAuctionModal({ auction, sellerId, opened = true, onClose }: EditAuctionModalProps) {
  const { mutate: updateAuction, isPending } = useUpdateAuction();

  if (!auction) return null;

  const initialValues: AuctionFormData = {
    sellerId: auction.sellerId || sellerId,
    productName: auction.productName,
    description: auction.description || '',
    imageUrl: auction.imageUrl || '',
    videoUrl: auction.videoUrl || '',
    startingBid: auction.startingBid || 0,
    incrementValue: auction.incrementValue,
    buyOutPrice: auction.buyOutPrice || 0,
    baseDuration: auction.baseDuration,
    scheduledTimeToStart: 'now', // Backend ignores this on update typically, or keep original if needed
    triggerSeconds: auction.triggerSeconds || 10,
    secondsExtended: auction.secondsExtended || 30,
    isExtendedDuration: !!auction.isExtendedDuration,
  };

  const handleSubmit = (payload: any) => {
    updateAuction({ id: auction.id, updates: payload }, {
      onSuccess: () => {
        toast.success("Auction updated successfully!");
        onClose();
      },
      onError: (err: any) => {
        toast.error(err.message || "Error updating auction");
      }
    });
  };

  return (
    <BaseAuctionFormModal
      title="Edit Auction"
      submitLabel="Save Changes"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      isPending={isPending}
      opened={opened}
      onClose={onClose}
    />
  );
}
