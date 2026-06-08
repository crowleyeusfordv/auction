import { Card, Image, Text, Button, Stack, Box, Flex, Paper } from '@mantine/core';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BidModal } from './BidModal';
import { useLiveRoomStore } from '../store/liveRoomStore';
import { useCurrentAuctionId } from '../store/LiveRoomContext';
import { OtherAuctionsModal } from './OtherAuctionsModal';
import type { Auction } from '@/features/auction/types/auction';
import { api } from '@/shared/api/api';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useNotificationStore } from '@/shared/store/useNotificationStore';
import leadingMascot from '@/assets/mascots/leading-cheer.webp';
import { LuClockArrowUp } from 'react-icons/lu';
import { resolveMediaUrl } from '@/shared/config/urls';

export interface InteractiveCardProps {
  productImage: string;
  productName: string;
  sellerId: string;
  onClickBid?: () => void;
  onConfirmBid?: (val: number) => void;
  onClickOtherAuctions?: () => void;
}

const formatCurrency = (value: number) => `¥${Math.max(0, value).toLocaleString('en-US')}`;

const playLeadingFeedbackSound = () => {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const context = new AudioContextCtor();
  const gain = context.createGain();
  const now = context.currentTime;
  const frequencies = [783.99, 987.77, 1174.66];

  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.085);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.085);
    oscillator.stop(now + index * 0.085 + 0.07);
  });

  window.setTimeout(() => {
    void context.close();
  }, 460);
};

export function InteractiveCard({ productImage, productName, sellerId, onClickBid, onConfirmBid, onClickOtherAuctions }: InteractiveCardProps) {
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isOtherAuctionModalOpen, setIsOtherAuctionModalOpen] = useState(false);
  const [otherAuctions, setOtherAuctions] = useState<Auction[]>([]);
  const [isLeadingFeedbackVisible, setIsLeadingFeedbackVisible] = useState(false);
  const [isExtensionFeedbackVisible, setIsExtensionFeedbackVisible] = useState(false);
  const lastLeaderRef = useRef<string | null>(null);
  const lastBidTimestampRef = useRef<string | null>(null);
  const leadingFeedbackTimerRef = useRef<number | null>(null);
  const extensionFeedbackTimerRef = useRef<number | null>(null);
  const lastExtensionTimestampRef = useRef<number | null>(null);

  const auctionId = useCurrentAuctionId();
  const currentUserId = useAuthStore(s => s.buyerUser?.id ?? (s.user?.role === 'buyer' ? s.user.id : undefined));
  const currentUsername = useAuthStore(s => s.buyerUser?.name ?? (s.user?.role === 'buyer' ? s.user.name : undefined)) || '我';
  const requestedBidAuctionId = useNotificationStore(s => s.requestedBidAuctionId);
  const activeOutbidAuctionId = useNotificationStore(s => s.activeOutbidAuctionId);
  const clearBidModalRequest = useNotificationStore(s => s.clearBidModalRequest);
  const status = useLiveRoomStore(s => s.rooms[auctionId]?.status);
  const currentBidInfo = useLiveRoomStore(s => s.rooms[auctionId]?.currentBid);
  const currentBid = currentBidInfo?.amount || 0;
  const incrementValue = useLiveRoomStore(s => s.rooms[auctionId]?.incrementValue || 10);
  const ranking = useLiveRoomStore(s => s.rooms[auctionId]?.ranking || []);
  const userPosition = useLiveRoomStore(s => s.rooms[auctionId]?.userPosition);
  const userAmount = useLiveRoomStore(s => s.rooms[auctionId]?.userAmount);
  const extensionNotice = useLiveRoomStore(s => s.rooms[auctionId]?.extensionNotice);
  const highestValue = formatCurrency(currentBid);
  const resolvedProductImage = resolveMediaUrl(productImage);
  const topRankers = ranking.slice(0, 3);
  const userRanker = currentUserId ? ranking.find(ranker => ranker.userId === currentUserId) : undefined;
  const effectiveUserPosition = userRanker?.position ?? userPosition ?? null;
  const effectiveUserAmount = userRanker?.bidAmount ?? userAmount ?? null;
  const leadingAmount = topRankers[0]?.bidAmount ?? currentBid;
  const isCurrentUserLeading = !!currentUserId && currentBidInfo?.bidderId === currentUserId;
  const gapToLeader = effectiveUserAmount === null ? leadingAmount : Math.max(0, leadingAmount - effectiveUserAmount);
  const hasRanking = topRankers.length > 0;

  const hideLeadingFeedback = useCallback(() => {
    setIsLeadingFeedbackVisible(false);

    if (leadingFeedbackTimerRef.current !== null) {
      window.clearTimeout(leadingFeedbackTimerRef.current);
      leadingFeedbackTimerRef.current = null;
    }
  }, []);

  const hideExtensionFeedback = useCallback(() => {
    setIsExtensionFeedbackVisible(false);

    if (extensionFeedbackTimerRef.current !== null) {
      window.clearTimeout(extensionFeedbackTimerRef.current);
      extensionFeedbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status === 'ended' || status === 'cancelled') {
      setIsBidModalOpen(false);
      setIsOtherAuctionModalOpen(false);
    }
  }, [status]);

  useEffect(() => {
    if (requestedBidAuctionId !== auctionId) return;

    setIsBidModalOpen(true);
    clearBidModalRequest();
  }, [auctionId, requestedBidAuctionId, clearBidModalRequest]);

  useEffect(() => {
    lastLeaderRef.current = null;
    lastBidTimestampRef.current = null;
    lastExtensionTimestampRef.current = null;
    hideLeadingFeedback();
    hideExtensionFeedback();
  }, [auctionId, hideLeadingFeedback, hideExtensionFeedback]);

  useEffect(() => {
    if (!extensionNotice || extensionNotice.timestamp === lastExtensionTimestampRef.current) return;

    lastExtensionTimestampRef.current = extensionNotice.timestamp;
    hideLeadingFeedback();
    setIsExtensionFeedbackVisible(true);

    if (extensionFeedbackTimerRef.current !== null) {
      window.clearTimeout(extensionFeedbackTimerRef.current);
    }

    extensionFeedbackTimerRef.current = window.setTimeout(() => {
      setIsExtensionFeedbackVisible(false);
      extensionFeedbackTimerRef.current = null;
    }, 3200);
  }, [extensionNotice, hideLeadingFeedback]);

  useEffect(() => {
    if (activeOutbidAuctionId === auctionId) {
      hideLeadingFeedback();
    }
  }, [activeOutbidAuctionId, auctionId, hideLeadingFeedback]);

  useEffect(() => {
    const nextLeader = currentBidInfo?.bidderId ?? null;
    const bidTimestamp = currentBidInfo?.timestamp ?? null;
    const previousLeader = lastLeaderRef.current;

    if (!bidTimestamp || bidTimestamp === lastBidTimestampRef.current) {
      lastLeaderRef.current = nextLeader;
      lastBidTimestampRef.current = bidTimestamp;
      return;
    }

    if (
      currentUserId &&
      nextLeader === currentUserId &&
      previousLeader !== currentUserId &&
      activeOutbidAuctionId !== auctionId
    ) {
      setIsLeadingFeedbackVisible(true);
      playLeadingFeedbackSound();

      if (leadingFeedbackTimerRef.current !== null) {
        window.clearTimeout(leadingFeedbackTimerRef.current);
      }

      leadingFeedbackTimerRef.current = window.setTimeout(() => {
        setIsLeadingFeedbackVisible(false);
        leadingFeedbackTimerRef.current = null;
      }, 2600);
    }

    lastLeaderRef.current = nextLeader;
    lastBidTimestampRef.current = bidTimestamp;
  }, [activeOutbidAuctionId, auctionId, currentBidInfo?.bidderId, currentBidInfo?.timestamp, currentUserId]);

  const handleBidClick = () => {
    setIsBidModalOpen(true);
    if (onClickBid) {
      onClickBid();
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
      <Card shadow="sm" p={6} radius="md" withBorder w="100%" h="100%" pos="relative" style={{ overflow: 'visible' }}>
        {(isExtensionFeedbackVisible || isLeadingFeedbackVisible) && (
          <Paper
            className={isExtensionFeedbackVisible ? "notification-toast-pop" : "leading-feedback-card"}
            pos="absolute"
            left={-4}
            right={-4}
            bottom="calc(100% + 10px)"
            p="xs"
            radius="md"
            shadow="lg"
            withBorder
            style={{
              zIndex: 35,
              borderColor: isExtensionFeedbackVisible ? 'var(--mantine-color-yellow-5)' : 'var(--mantine-color-green-4)',
              background: isExtensionFeedbackVisible
                ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.20) 0%, white 56%)'
                : 'linear-gradient(135deg, rgba(64, 192, 87, 0.18) 0%, white 56%)',
            }}
          >
            <Flex align="center" gap="xs">
              {isExtensionFeedbackVisible ? (
                <Flex
                  align="center"
                  justify="center"
                  w={58}
                  h={58}
                  bg="yellow.1"
                  c="yellow.8"
                  style={{ borderRadius: 8, flexShrink: 0, fontSize: 30, fontWeight: 900 }}
                >
                  <LuClockArrowUp size={30} />
                </Flex>
              ) : (
                <Box
                  component="img"
                  src={leadingMascot}
                  alt=""
                  w={58}
                  h={58}
                  style={{ objectFit: 'contain', flexShrink: 0 }}
                />
              )}
              <Box style={{ minWidth: 0 }}>
                <Text fw={900} size="sm" c={isExtensionFeedbackVisible ? 'yellow.9' : 'green.8'} lh={1.15}>
                  {isExtensionFeedbackVisible ? '竞拍延时' : '你现在领先'}
                </Text>
                <Text fw={600} size="xs" c="gray.7" lh={1.25}>
                  {isExtensionFeedbackVisible ? '最后时刻有新出价，倒计时已延长' : '保持优势，离拍下它更近了'}
                </Text>
              </Box>
            </Flex>
          </Paper>
        )}

        <Flex direction="column" h="100%">
          <Box h="130px" w="100%" className="overflow-hidden">
            <Image src={resolvedProductImage} h="100%" w="100%" fit="cover" alt={productName} radius="md" />
          </Box>

          <Stack gap={0} flex={1} justify="space-between">
            <Stack align='center' gap={2}>
              <Text fw={500} size="lg" lineClamp={1}>{productName}</Text>
              <Text fw={700} size="md" c="green">{highestValue}</Text>
            </Stack>

            <Paper bg="gray.0" p={6} radius="sm" withBorder>
              <Flex justify="space-between" align="center" mb={4}>
                <Text size="xs" fw={700} c="gray.7">实时排行</Text>
                <Text size="xs" fw={700} c={isCurrentUserLeading ? 'green.7' : 'red.6'}>
                  {isCurrentUserLeading ? '当前领先' : hasRanking ? `距第1名 ${formatCurrency(gapToLeader)}` : '暂无出价'}
                </Text>
              </Flex>

              <Stack gap={2}>
                {hasRanking ? (
                  topRankers.map((ranker) => {
                    const isCurrentUser = ranker.userId === currentUserId;
                    return (
                      <Flex
                        key={ranker.userId}
                        justify="space-between"
                        align="center"
                        bg={isCurrentUser ? 'green.1' : 'transparent'}
                        px={4}
                        py={2}
                        style={{ borderRadius: 4 }}
                      >
                        <Text size="xs" fw={isCurrentUser ? 800 : 600} c={isCurrentUser ? 'green.8' : 'gray.7'} lineClamp={1}>
                          #{ranker.position} {isCurrentUser ? currentUsername : ranker.username}
                        </Text>
                        <Text size="xs" fw={700} c={isCurrentUser ? 'green.8' : 'gray.8'}>
                          {formatCurrency(ranker.bidAmount)}
                        </Text>
                      </Flex>
                    );
                  })
                ) : (
                  <Text size="xs" ta="center" c="gray.5" py={4}>暂无出价</Text>
                )}
              </Stack>

              {effectiveUserPosition && effectiveUserPosition > 3 && effectiveUserAmount !== null && (
                <Flex justify="space-between" align="center" mt={4} px={4} py={3} bg="green.1" style={{ borderRadius: 4 }}>
                  <Text size="xs" fw={800} c="green.8">我的排名 #{effectiveUserPosition}</Text>
                  <Text size="xs" fw={800} c="green.8">{formatCurrency(effectiveUserAmount)}</Text>
                </Flex>
              )}
            </Paper>

            <Stack gap={4}>
              <Button fullWidth radius="sm" size="compact-sm" onClick={handleBidClick}>
                出价
              </Button>
              <Button variant="outline" radius="sm" size="compact-sm" onClick={handleOtherAuctionsClick}>
                其他拍卖
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

      <OtherAuctionsModal
        isOpen={isOtherAuctionModalOpen}
        onClose={() => setIsOtherAuctionModalOpen(false)}
        auctions={otherAuctions}
        onWatch={handleOtherAuctionsClick}
      />
    </>
  );
}
