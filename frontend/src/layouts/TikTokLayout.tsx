import { Flex, Box } from '@mantine/core';
import { Outlet, useLocation } from 'react-router';

export default function TikTokLayout() {
  const location = useLocation();
  const isLiveRoom = location.pathname.includes('live-room');

  return (
    <Flex w="100%" h="100dvh" align="center" justify="center" bg="dark.9">
      <Box w={430} h="100dvh" pos="relative" bg={isLiveRoom ? 'transparent' : 'white'} style={{ overflowY: 'auto' }}>
        <Outlet />
      </Box>
    </Flex>
  );
}
