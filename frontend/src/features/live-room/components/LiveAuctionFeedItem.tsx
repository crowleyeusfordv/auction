import { Box, Button, Drawer, Flex, Grid, Stack } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import MediaDisplay from './MediaDisplay';
import { ViewerCount } from './ViewerCount';
import { InteractiveCard } from './InteractiveCard';
import { Chatbox } from './Chatbox';
import { HamburgerMenu } from '../../../shared/components/HamburgerMenu';
import { useState, useEffect, useRef } from 'react';
import { useAuctionSocket } from '@/shared/hooks/useAuctionSocket';
import { LiveRoomContext } from '../store/LiveRoomContext';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';
import { useLiveRoomStore } from '../store/liveRoomStore';
import { useNotificationStore } from '@/shared/store/useNotificationStore';

export interface LiveAuctionFeedItemProps {
  id: string;
  mediaSrc: string;
  mediaType?: 'video' | 'image';
  viewerCount?: number;
  productImage: string;
  productName: string;
  highestValue?: string;
  messages: Array<{ id: string; sender: string; text: string; isBot?: boolean }>;
  sellerId: string;
  onMenuClick?: () => void;
  onAuctionEnded?: () => void;
}

export function LiveAuctionFeedItem({
  id,
  mediaSrc,
  mediaType,
  productImage,
  productName,
  messages,
  sellerId,
  onAuctionEnded
}: LiveAuctionFeedItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { ref, entry } = useIntersection({
    threshold: 0.5, // Considera visível se 50% estiver na tela
  });
  const isVisible = entry?.isIntersecting ?? false;

  const { sendJsonMessage } = useAuctionSocket(id, isVisible);

  useEffect(() => {
    const container = document.getElementById('feed-scroll-container');
    if (container) {
      container.style.overflowY = isOpen ? 'hidden' : 'scroll';
    }
  }, [isOpen]);

  const status = useLiveRoomStore((s) => s.rooms[id]?.status);
  const isResultModalOpen = useNotificationStore((s) => s.isResultModalOpen);
  const [hasModalOpened, setHasModalOpened] = useState(false);

  useEffect(() => {
    if (isResultModalOpen) {
      setHasModalOpened(true);
    }
  }, [isResultModalOpen]);

  const onAuctionEndedRef = useRef(onAuctionEnded);
  onAuctionEndedRef.current = onAuctionEnded;

  useEffect(() => {
    if (status === 'ended') {
      if (isResultModalOpen) {
        return;
      }

      if (hasModalOpened) {
        onAuctionEndedRef.current?.();
        return;
      }

      const timer = setTimeout(() => {
        if (!useNotificationStore.getState().isResultModalOpen) {
          onAuctionEndedRef.current?.();
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, isResultModalOpen, hasModalOpened]);

  return (
    <LiveRoomContext.Provider value={id}>
      <Box
        ref={ref}
        pos="relative"
        w="100%"
        h="100vh"
        className="snap-start snap-always"
        style={{ overflow: 'hidden', transform: 'translateZ(0)' }}
      >
        <MediaDisplay src={mediaSrc} type={mediaType || 'image'} />

        <Flex
          pos="absolute"
          inset={0}
          p="md"
          direction="column"
          justify="space-between"
        >
          <Flex justify="space-between">
            <ViewerCount />
            <HamburgerMenu onClick={() => setIsOpen(!isOpen)} />
          </Flex>

          <Grid h="30vh" gap={8}>
            <Grid.Col span={6}>
              <Chatbox messages={messages} />
            </Grid.Col>
            <Grid.Col span={6} >
              <InteractiveCard
                productImage={productImage}
                productName={productName}
                sellerId={sellerId}
                onConfirmBid={(amount: number) => {
                  sendJsonMessage({ type: "place_bid", amount });
                }}
              />
            </Grid.Col>
          </Grid>
        </Flex>

        <Drawer
          opened={isOpen}
          onClose={() => setIsOpen(false)}
          withinPortal={false}
          zIndex={10}
          size={250}
          position='right'
        >
          <Stack gap={10} >
            <Button radius="sm" onClick={() => navigate(ROUTES.BUYER.BIDS)} >
              My bids
            </Button>
            <Button radius="sm" onClick={() => navigate(ROUTES.AUCTIONS.ROOT)}>
              Auctions List
            </Button>
          </Stack>
        </Drawer>
      </Box >
    </LiveRoomContext.Provider>
  );
}

