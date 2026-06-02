import { Box, Button, Drawer, Flex, Grid, Stack } from '@mantine/core';
import MediaDisplay from './MediaDisplay';
import { ViewerCount } from './ViewerCount';
import { InteractiveCard } from './InteractiveCard';
import { Chatbox } from './Chatbox';
import { HamburgerMenu } from '../../../shared/components/HamburgerMenu';
import { useState, useEffect } from 'react';
import { useAuctionSocket } from '@/shared/hooks/useAuctionSocket';
import { LiveRoomContext } from '../store/LiveRoomContext';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';

export interface LiveAuctionFeedItemProps {
  id: string;
  mediaSrc: string;
  mediaType?: 'video' | 'image';
  viewerCount: number;
  productImage: string;
  productName: string;
  highestValue: string;
  messages: Array<{ id: string; sender: string; text: string; isBot?: boolean }>;
  onMenuClick: () => void;
}

export function LiveAuctionFeedItem({
  id,
  mediaSrc,
  mediaType,
  viewerCount,
  productImage,
  productName,
  highestValue,
  messages,
  onMenuClick
}: LiveAuctionFeedItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useAuctionSocket(id);

  useEffect(() => {
    const container = document.getElementById('feed-scroll-container');
    if (container) {
      container.style.overflowY = isOpen ? 'hidden' : 'scroll';
    }
  }, [isOpen]);

  return (
    <LiveRoomContext.Provider value={id}>
      <Box
        pos="relative"
        w="100%"
        h="100vh"
        className="snap-start snap-always"
        style={{ overflow: 'hidden', transform: 'translateZ(0)' }}
      >
        <MediaDisplay src={mediaSrc} type={mediaType} />

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
            <Button radius="sm" onClick={() => navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(id))}>
              Live room
            </Button >
            <Button radius="sm" onClick={() => navigate(ROUTES.BUYER.BIDS)} >
              My bids
            </Button>
            <Button radius="sm" onClick={() => navigate(ROUTES.AUCTIONS.ROOT)}>
              Auctions List
            </Button>
            <Button radius="sm" onClick={() => navigate(ROUTES.AUCTIONS.RULES)}>
              Auctions Rules
            </Button>
          </Stack>
        </Drawer>
      </Box >
    </LiveRoomContext.Provider>
  );
}

