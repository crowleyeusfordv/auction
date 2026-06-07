import { ActionIcon, Box, Button, Group, Title, Loader, Stack, Text, Accordion, Tooltip } from '@mantine/core';
import { useNavigate } from 'react-router';
import { FiArrowLeft, FiList, FiRadio } from 'react-icons/fi';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useGetParticipatedAuctions } from '@/features/auction/hooks/useAuctions';
import ProductCard from '@/shared/components/ProductCard';
import { ROUTES } from '@/shared/constants/routes';

export default function MyBidsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.buyerUser ?? (s.user?.role === 'buyer' ? s.user : null));
  const { data: auctions = [], isPending } = useGetParticipatedAuctions(user?.id || '');
  const statusColorMap: Record<string, string> = {
    completed: 'green',
    cancelled: 'red',
    on_going: 'blue',
    not_started: 'gray',
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(ROUTES.AUCTIONS.ROOT);
  };

  return (
    <Box p="md" maw={800} mx="auto">
      <Group justify="space-between" align="center" mb="lg" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <Tooltip label="Back">
            <ActionIcon
              aria-label="Back"
              variant="light"
              color="dark"
              size="lg"
              radius="sm"
              onClick={goBack}
            >
              <FiArrowLeft />
            </ActionIcon>
          </Tooltip>
          <Title order={2}>My Bids</Title>
        </Group>
        <Button
          leftSection={<FiList />}
          variant="light"
          color="dark"
          radius="sm"
          onClick={() => navigate(ROUTES.AUCTIONS.ROOT)}
        >
          Auction List
        </Button>
      </Group>

      {isPending ? (
        <Loader />
      ) : auctions.length === 0 ? (
        <Text c="dimmed">You have not participated in any auctions yet.</Text>
      ) : (
        <Stack gap="xl">
          {auctions.map((auction) => (
            <Box key={auction.auctionId} p="md" bg="gray.1" style={{ borderRadius: '12px' }}>
              <ProductCard>
                <ProductCard.Image src={auction.imageUrl || ''} />
                <ProductCard.Content gap="">
                  <ProductCard.Title>{auction.productName}</ProductCard.Title>
                  <ProductCard.Stats>
                    <ProductCard.Stat label="Highest Bid" value={`$${Number(auction.highestBid).toFixed(2)}`} />
                  </ProductCard.Stats>
                </ProductCard.Content>
                {auction.status === 'on_going' ? (
                  <Button
                    leftSection={<FiRadio />}
                    radius="sm"
                    size="xs"
                    onClick={() => navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(auction.auctionId))}
                    mt="auto"
                  >
                    Live Room
                  </Button>
                ) : (
                  <ProductCard.Badge color={statusColorMap[auction.status] || 'gray'} style={{ alignSelf: 'flex-start' }}>
                    {auction.status === 'not_started' ? 'upcoming' : auction.status}
                  </ProductCard.Badge>
                )}
              </ProductCard>

              <Accordion variant="separated" mt="md" radius="md">
                <Accordion.Item value="history">
                  <Accordion.Control>Your Bid History</Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      {auction.userBids.map((bid) => (
                        <Group key={bid.id} justify="space-between" p="sm" bg="white" style={{ borderRadius: '8px', border: '1px solid #eee' }}>
                          <Text fw={600} c="blue">${Number(bid.amount).toFixed(2)}</Text>
                          <Text size="sm" c="dimmed">{new Date(bid.createdAt).toLocaleString()}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
