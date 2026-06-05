import { Card, Image, Text, Button, Stack, Box, Flex } from '@mantine/core';
import { useState } from 'react';
import { BidModal } from './BidModal';
import { RankingModal } from './RankingModal';
import { useLiveRoomStore } from '../store/liveRoomStore';
import { useCurrentAuctionId } from '../store/LiveRoomContext';
import { OtherAuctionsModal } from './OtherAuctionsModal';
import type { BuyerAuction } from '@/features/auctions/buyer/types/auction.buyer';

const MOCK_AUCTIONS: BuyerAuction[] = [
  // 4 Ongoing
  { id: 'm1', productName: 'Vintage Camera', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=200', currentBid: 5000, myLastBid: 0, status: 'on going', scheduledTimeToStart: new Date().toISOString() },
  { id: 'm2', productName: 'Leica Lens', imageUrl: 'https://images.unsplash.com/photo-1617005082833-1eb5857038e3?auto=format&fit=crop&q=80&w=200', currentBid: 3200, myLastBid: 3000, status: 'on going', scheduledTimeToStart: new Date().toISOString() },
  { id: 'm3', productName: 'Sony A7III', imageUrl: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&q=80&w=200', currentBid: 15000, myLastBid: 0, status: 'on going', scheduledTimeToStart: new Date().toISOString() },
  { id: 'm4', productName: 'Drone DJI', imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&q=80&w=200', currentBid: 8000, myLastBid: 8000, status: 'on going', scheduledTimeToStart: new Date().toISOString() },

  // 3 Upcoming
  { id: 'm5', productName: 'Rare Vinyl', imageUrl: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=200', currentBid: 0, myLastBid: 0, status: 'not started', scheduledTimeToStart: new Date().toISOString() },
  { id: 'm6', productName: 'Acoustic Guitar', imageUrl: 'https://images.unsplash.com/photo-1550227298-1f24f241e1ce?auto=format&fit=crop&q=80&w=200', currentBid: 0, myLastBid: 0, status: 'not started', scheduledTimeToStart: new Date().toISOString() },
  { id: 'm7', productName: 'Electric Piano', imageUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=200', currentBid: 0, myLastBid: 0, status: 'not started', scheduledTimeToStart: new Date().toISOString() },

  // 2 Ended
  { id: 'm8', productName: 'Classic Watch', imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=200', currentBid: 12000, myLastBid: 10000, status: 'completed', scheduledTimeToStart: new Date().toISOString() },
  { id: 'm9', productName: 'Gold Necklace', imageUrl: 'https://images.unsplash.com/photo-1599643478524-fb66f70d00f8?auto=format&fit=crop&q=80&w=200', currentBid: 45000, myLastBid: 0, status: 'completed', scheduledTimeToStart: new Date().toISOString() },
];

interface InteractiveCardProps {
  productImage: string;
  productName: string;
  onClickBid?: () => void;
  onClickRanking?: () => void;
  onClickOtherAuctions?: () => void;
}

export function InteractiveCard({ productImage, productName, onClickBid, onClickRanking, onClickOtherAuctions }: InteractiveCardProps) {
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isOtherAuctionModalOpen, setIsOtherAuctionModalOpen] = useState(false);

  const auctionId = useCurrentAuctionId();
  const currentBid = useLiveRoomStore(s => s.rooms[auctionId]?.currentBid?.amount || 0);
  const highestValue = `¥${currentBid}`;

  const handleBidClick = () => {
    setIsBidModalOpen(true);
    if (onClickBid) {
      onClickBid();
    }
  };

  const handleRankingClick = () => {
    setIsRankingModalOpen(true);
    if (onClickRanking) {
      onClickRanking();
    }
  };

  const handleOtherAuctionsClick = () => {
    setIsOtherAuctionModalOpen(true);
    if (onClickOtherAuctions) {
      onClickOtherAuctions();
    }
  };

  return (
    <>
      <Card shadow="sm" p={6} radius="md" withBorder w="100%" h="100%">
        <Flex direction="column" h="100%">
          <Box h="130px" w="100%" className="overflow-hidden">
            <Image src={productImage} h="100%" w="100%" fit="cover" alt={productName} radius="md" />
          </Box>

          <Stack gap={0} flex={1} justify="space-between">
            <Stack align='center' gap={2}>
              <Text fw={500} size="lg" lineClamp={1}>{productName}</Text>
              <Text fw={700} size="md" c="blue">{highestValue}</Text>
            </Stack>

            <Stack gap={4}>
              <Button fullWidth radius="sm" size="compact-sm" onClick={handleBidClick}>
                BID
              </Button>
              <Button variant="outline" radius="sm" size="compact-sm" onClick={handleRankingClick}>
                RANKING
              </Button>
              <Button variant="outline" radius="sm" size="compact-sm" onClick={handleOtherAuctionsClick}>
                OTHER AUCTIONS
              </Button>
            </Stack>
          </Stack>
        </Flex>
      </Card>

      <BidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        productImage={productImage}
        productName={productName}
        myLastBid={0}
        fixedIncrement={50}
        onConfirmBid={(val) => console.log('Bid confirmed:', val)}
      />

      <RankingModal
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
      />


      <OtherAuctionsModal
        isOpen={isOtherAuctionModalOpen}
        onClose={() => setIsOtherAuctionModalOpen(false)}
        auctions={MOCK_AUCTIONS}
        onWatch={handleOtherAuctionsClick}
      />
    </>
  );
}
