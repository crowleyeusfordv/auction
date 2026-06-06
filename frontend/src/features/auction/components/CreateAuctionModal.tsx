import { toast } from 'sonner';
import { BaseAuctionFormModal } from './BaseAuctionFormModal';
import { useCreateAuction } from '../hooks/useAuctions';
import type { AuctionFormData } from '../schemas/auctionSchema';

interface CreateAuctionModalProps {
  sellerId: string;
  opened?: boolean;
  onClose: () => void;
}

export function CreateAuctionModal({ sellerId, opened = true, onClose }: CreateAuctionModalProps) {
  const { mutate: createAuction, isPending } = useCreateAuction();

  const initialValues: AuctionFormData = {
    sellerId: sellerId,
    productName: '',
    description: '',
    startingBid: 0,
    incrementValue: 1,
    buyOutPrice: 0,
    baseDuration: 60,
    scheduledTimeToStart: 'now',
    triggerSeconds: 10,
    secondsExtended: 30,
    isExtendedDuration: false,
  };

  const handleSubmit = (payload: any) => {
    createAuction(payload, {
      onSuccess: () => {
        toast.success("Auction created successfully!");
        onClose();
      },
      onError: (err: any) => {
        toast.error(`API Error: ${err.message}`);
      }
    });
  };

  return (
    <BaseAuctionFormModal
      title="Create Auction"
      submitLabel="Create Auction"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      isPending={isPending}
      opened={opened}
      onClose={onClose}
    />
  );
}
