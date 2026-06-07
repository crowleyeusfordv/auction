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
  const timer = useLiveRoomStore(s => s.rooms[auctionId]?.timer);
  const minBid = highestBid + fixedIncrement;
  
  const [userBid, setUserBid] = useState<number | null>(null);
  const pendingBid = userBid !== null ? Math.max(userBid, minBid) : minBid;
  
  const [endTime, setEndTime] = useState(() => Date.now() + initialSecondsLeft * 1000);

  useEffect(() => {
    if (timer?.remainingMs !== undefined) {
      setEndTime(Date.now() + timer.remainingMs);
    }
  }, [timer?.remainingMs, timer?.serverTime]);

  useEffect(() => {
    if (timer?.remainingMs !== undefined) {
      setEndTime(Date.now() + timer.remainingMs);
    }
  }, [timer?.remainingMs, timer?.serverTime]);

  return (
    <Sheet isOpen={isOpen} onClose={onClose} overlayOpacity={0.15}>
      {/* 2. Header and Timer */}
      <CountDown endTime={endTime} isOpen={isOpen} />
      <ProductCard>
        <ProductCard.Image src={productImage} />
        <ProductCard.Content>
          <ProductCard.Title>{productName}</ProductCard.Title>
          <ProductCard.Stats>
            <ProductCard.Stat label="Highest Bid" value={`¥${highestBid}`} />
            <ProductCard.Stat label="My last bid" value={`¥${myLastBid}`} />
          </ProductCard.Stats>
        </ProductCard.Content>
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
            onClick={() => setUserBid(Math.max(minBid, pendingBid - fixedIncrement))}
          >
            <LuMinus size={16} />
          </ActionIcon>

          <Text fw={700} fz={30}>¥{pendingBid}</Text>

          <ActionIcon
            variant="light"
            color="gray"
            radius="md"
            size="xl"
            onClick={() => setUserBid(pendingBid + fixedIncrement)}
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
