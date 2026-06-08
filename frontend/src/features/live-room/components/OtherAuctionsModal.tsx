import { Sheet } from '@/shared/components/Sheet';
import { AuctionList } from '@/shared/components/AuctionList/AuctionList';
import type { Auction } from '@/features/auction/types/auction';

export interface OtherAuctionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctions: Auction[];
  onWatch: (auctionId: string) => void;
}

export function OtherAuctionsModal({ isOpen, onClose, auctions, onWatch }: OtherAuctionsModalProps) {
  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <AuctionList
        auctions={auctions}
        onWatch={onWatch}
        title={<>该卖家的<br />其他拍卖</>}
        emptyMessage="该卖家暂无其他拍卖"
      />
    </Sheet>
  );
}
