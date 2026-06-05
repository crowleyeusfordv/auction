import { Box, Flex } from '@mantine/core';
import { LiveAuctionFeed } from '../features/live-room/components/LiveAuctionFeed';

export default function LiveRoomPage() {
  return (
    <Flex
      w="100%"
      h="100vh"
      align="center"
      justify="center"
      bg="dark.9"
    >
      <Box
        w={430}
        h="100vh"
        pos="relative"
      >
        <LiveAuctionFeed />
      </Box>
    </Flex>
  );
}
