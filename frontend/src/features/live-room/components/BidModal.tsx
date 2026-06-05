import { Button, Flex, Text, ActionIcon, Paper, Badge } from '@mantine/core';
import { Sheet } from '@/shared/components/Sheet';
import { useState, useEffect } from 'react';
import { LuMinus, LuPlus } from "react-icons/lu";
import CountDown from '../../../shared/components/CountDown';
import ProductCard from '@/shared/components/ProductCard';

import { useLiveRoomStore } from '../store/liveRoomStore';
import { useCurrentAuctionId } from '../store/LiveRoomContext';

export interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  productImage: string;
  productName: string;
  myLastBid: number;
  fixedIncrement: number;
  initialSecondsLeft?: number;
  onConfirmBid: (value: number) => void;
}

export function BidModal({
  isOpen,
  onClose,
  productImage,
  productName,
  myLastBid,
  fixedIncrement,
  initialSecondsLeft = 560,
  onConfirmBid,
}: BidModalProps) {
  const auctionId = useCurrentAuctionId();
  const highestBid = useLiveRoomStore(s => s.rooms[auctionId]?.currentBid?.amount || 0);
  const [pendingBid, setPendingBid] = useState(highestBid + fixedIncrement);
  const [endTime] = useState(() => Date.now() + initialSecondsLeft * 1000);

  return (
    <Sheet isOpen={isOpen} onClose={onClose} overlayOpacity={0.15}>
      {/* 2. Header and Timer */}
      <CountDown endTime={endTime} isOpen={isOpen} />
      <ProductCard>
        <ProductCard.Image src={productImage} />
        <ProductCard.Info>
          <ProductCard.Title>{productName}</ProductCard.Title>
          <ProductCard.Stats>
            <ProductCard.Stat label="Highest Bid" value={`¥${highestBid}`} />
            <ProductCard.Stat label="My last bid" value={`¥${myLastBid}`} />
          </ProductCard.Stats>
        </ProductCard.Info>
      </ProductCard>

      {/* 5. Bid Controls and Confirmation */}
      <Paper bg="white" p="md" pt={32} mt="xs" pos="relative" radius="md" shadow='sm'>
        {/* 4. Status Badge */}
        <Badge
          color="red.5"
          pos="absolute"
          top={-10}
          left="50%"
          style={{ transform: 'translateX(-50%)', zIndex: 20 }}
          size="sm"
          variant="filled"
        >
          ¥100 above...
        </Badge>

        <Flex align="center" justify="space-between" mb="xs">
          <ActionIcon
            variant="light"
            color="gray"
            radius="md"
            size="xl"
            onClick={() => setPendingBid(p => Math.max(highestBid + fixedIncrement, p - fixedIncrement))}
          >
            <LuMinus size={16} />
          </ActionIcon>

          <Text fw={700} fz={30}>¥{pendingBid}</Text>

          <ActionIcon
            variant="light"
            color="gray"
            radius="md"
            size="xl"
            onClick={() => setPendingBid(p => p + fixedIncrement)}
          >
            <LuPlus size={16} />
          </ActionIcon>
        </Flex>

        <Text ta="center" fz={12} c="gray.4" mb="md">
          Fixed Increment: ¥{fixedIncrement}
        </Text>

        <Button
          fullWidth
          color="red"
          radius="md"
          onClick={() => {
            onConfirmBid(pendingBid);
            onClose();
          }}
        >
          CONFIRM BID
        </Button>
      </Paper>
    </Sheet>
  );
}
