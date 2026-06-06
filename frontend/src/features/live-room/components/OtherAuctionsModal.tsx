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
        title={<>OTHER AUCTIONS<br />FROM THE SELLER</>}
        emptyMessage="There is no other auctions from this seller"
      />
    </Sheet>
  );
}
