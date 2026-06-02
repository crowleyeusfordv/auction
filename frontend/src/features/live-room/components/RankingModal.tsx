import { Flex, Text, Paper } from '@mantine/core';
import { Sheet } from '@/shared/components/Sheet';
import { BsThreeDotsVertical } from "react-icons/bs";


import { useLiveRoomStore } from '../store/liveRoomStore';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useCurrentAuctionId } from '../store/LiveRoomContext';

export interface Ranker {
  userId: string;
  username: string;
  bidAmount: number;
  position: number;
}

export interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_RANKING: Ranker[] = [];

export function RankingModal({ isOpen, onClose }: RankingModalProps) {
  const auctionId = useCurrentAuctionId();
  const rankers = useLiveRoomStore(s => s.rooms[auctionId]?.ranking || EMPTY_RANKING);
  const currentUserId = useAuthStore(s => s.user?.id) || "unknown";

  const top3 = rankers.slice(0, 3);
  const userRanker = rankers.find(r => r.userId === currentUserId);
  const isUserOutsideTop3 = userRanker && userRanker.position > 3;

  const renderRankerRow = (ranker: Ranker) => {
    const isCurrentUser = ranker.userId === currentUserId;
    return (
      <Flex
        key={ranker.userId}
        align="center"
        justify="space-between"
        p="sm"
        bg={isCurrentUser ? 'var(--mantine-primary-color-filled)' : 'transparent'}
        style={{ borderRadius: '8px', marginBottom: '4px' }}
      >
        <Flex align="center" gap="md">
          <Text c={isCurrentUser ? 'white' : undefined} fw={isCurrentUser ? 700 : 500} w={30} ta="center" size="lg">
            #{ranker.position}
          </Text>
          <Text c={isCurrentUser ? 'white' : undefined} fw={isCurrentUser ? 700 : 500} size="sm">
            {ranker.username}
          </Text>
        </Flex>
        <Text c={isCurrentUser ? 'white' : undefined} fw={700}>¥{ranker.bidAmount}</Text>
      </Flex>
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <Text fw={800} size="xl" mb="md" ta="center" c='var(--mantine-primary-color-filled)'>LIVE RANKING</Text>

      <Paper bg="white" p="xs" radius="md" shadow="sm">
        {rankers.length === 0 ? (
          <Text ta="center" c="gray.5" py="xl">No bids yet</Text>
        ) : (
          <>
            {top3.map(renderRankerRow)}

            {isUserOutsideTop3 && (
              <>
                <Flex justify='center' p={12}>
                  <BsThreeDotsVertical />
                </Flex>
                {renderRankerRow(userRanker)}
              </>
            )}
          </>
        )}
      </Paper>
    </Sheet>
  );
}
