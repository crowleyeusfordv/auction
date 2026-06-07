import { toast } from 'sonner';
import { BaseAuctionFormModal } from './BaseAuctionFormModal';
import { useUpdateAuction } from '../hooks/useAuctions';
import type { Auction } from '../types/auction';
import type { AuctionFormData } from '../schemas/auctionSchema';
import { toDateTimeLocalInputValue } from '../utils/dateTime';

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
    baseDuration: auction.baseDuration || 5,
    scheduledTimeToStart: toDateTimeLocalInputValue(auction.scheduledTimeToStart),
    triggerSeconds: auction.triggerSeconds || 10,
    secondsExtended: auction.secondsExtended || 30,
    isExtendedDuration: !!auction.isExtendedDuration,
  };

  const handleSubmit = (payload: any) => {
    updateAuction({ id: auction.id, updates: payload }, {
      onSuccess: () => {
        toast.success("拍卖更新成功！");
        onClose();
      },
      onError: () => {
        toast.error("更新拍卖失败，请重试。");
      }
    });
  };

  return (
    <BaseAuctionFormModal
      title="编辑拍卖"
      submitLabel="保存修改"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      isPending={isPending}
      opened={opened}
      onClose={onClose}
    />
  );
}
