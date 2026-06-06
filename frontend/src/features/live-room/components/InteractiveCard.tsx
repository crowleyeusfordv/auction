import { Card, Image, Text, Button, Stack, Box, Flex } from '@mantine/core';
import { useState } from 'react';
import { BidModal } from './BidModal';
import { RankingModal } from './RankingModal';
import { useLiveRoomStore } from '../store/liveRoomStore';
import { useCurrentAuctionId } from '../store/LiveRoomContext';
import { OtherAuctionsModal } from './OtherAuctionsModal';
import type { Auction } from '@/features/auction/types/auction';
import { api } from '@/shared/api/api';

export interface InteractiveCardProps {
  productImage: string;
  productName: string;
  sellerId: string;
  onClickBid?: () => void;
  onConfirmBid?: (val: number) => void;
  onClickRanking?: () => void;
  onClickOtherAuctions?: () => void;
}

export function InteractiveCard({ productImage, productName, sellerId, onClickBid, onConfirmBid, onClickRanking, onClickOtherAuctions }: InteractiveCardProps) {
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isOtherAuctionModalOpen, setIsOtherAuctionModalOpen] = useState(false);
  const [otherAuctions, setOtherAuctions] = useState<Auction[]>([]);

  const auctionId = useCurrentAuctionId();
  const currentBid = useLiveRoomStore(s => s.rooms[auctionId]?.currentBid?.amount || 0);
  const incrementValue = useLiveRoomStore(s => s.rooms[auctionId]?.incrementValue || 10);
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
    if (otherAuctions.length === 0) {
      api.get<{ items: Auction[] }>(`/auctions?excludeId=${auctionId}&seller_id=${sellerId}`)
        .then(res => setOtherAuctions(res.items || []))
        .catch(console.error);
    }
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
        fixedIncrement={incrementValue}
        onConfirmBid={(val) => {
          onConfirmBid?.(val);
          setIsBidModalOpen(false);
        }}
      />

      <RankingModal
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
      />


      <OtherAuctionsModal
        isOpen={isOtherAuctionModalOpen}
        onClose={() => setIsOtherAuctionModalOpen(false)}
        auctions={otherAuctions}
        onWatch={handleOtherAuctionsClick}
      />
    </>
  );
}
