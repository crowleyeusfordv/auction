import { Box, Button, Drawer, Flex, Stack } from '@mantine/core';
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
import { CancelledNotificationModal } from '@/shared/components/Notifications/CancelledNotificationModal';

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

  useEffect(() => {
    if (isVisible) {
      navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(id), { replace: true });
    }
  }, [isVisible, id, navigate]);

  const { sendJsonMessage } = useAuctionSocket(id, isVisible);

  useEffect(() => {
    const container = document.getElementById('feed-scroll-container');
    if (container) {
      container.style.overflowY = isOpen ? 'hidden' : 'scroll';
    }
  }, [isOpen]);

  const status = useLiveRoomStore((s) => s.rooms[id]?.status);
  const cancelResult = useLiveRoomStore((s) => s.rooms[id]?.cancelResult);
  const isResultModalOpen = useNotificationStore((s) => s.isResultModalOpen);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [hasModalOpened, setHasModalOpened] = useState(false);

  useEffect(() => {
    if (isResultModalOpen) {
      setHasModalOpened(true);
    }
  }, [isResultModalOpen]);

  useEffect(() => {
    if (status === 'cancelled' && cancelResult) {
      setIsCancelModalOpen(true);
      setHasModalOpened(true);
      useNotificationStore.getState().setResultModalOpen(true);
    }
  }, [status, cancelResult]);

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    useNotificationStore.getState().setResultModalOpen(false);
  };

  const onAuctionEndedRef = useRef(onAuctionEnded);
  onAuctionEndedRef.current = onAuctionEnded;

  useEffect(() => {
    if (status === 'ended' || status === 'cancelled') {
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
        h="100dvh"
        className="snap-start snap-always"
        style={{ overflow: 'hidden', transform: 'translateZ(0)' }}
      >
        <MediaDisplay src={mediaSrc} type={mediaType || 'image'} isActive={isVisible} />

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

          <Flex gap={8} w="100%">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Chatbox messages={messages} />
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <InteractiveCard
                productImage={productImage}
                productName={productName}
                sellerId={sellerId}
                onConfirmBid={(amount: number) => {
                  sendJsonMessage({ type: "place_bid", amount });
                }}
              />
            </Box>
          </Flex>
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
              我的出价
            </Button>
            <Button radius="sm" onClick={() => navigate(ROUTES.AUCTIONS.ROOT)}>
              拍卖列表
            </Button>
          </Stack>
        </Drawer>

        {cancelResult && (
          <CancelledNotificationModal
            isOpen={isCancelModalOpen}
            onClose={closeCancelModal}
            auctionName={cancelResult.auctionName || productName}
            imageUrl={cancelResult.imageUrl || productImage}
          />
        )}
      </Box >
    </LiveRoomContext.Provider>
  );
}

