import { Box, Group, Title, Loader, Stack, Text, Accordion } from '@mantine/core';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useGetParticipatedAuctions } from '@/features/auctions/hooks/useAuctions';
import ProductCard from '@/shared/components/ProductCard';

export default function MyBidsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: auctions = [], isPending } = useGetParticipatedAuctions(user?.id || '');

  return (
    <Box p="md" maw={800} mx="auto">
      <Group justify="space-between" mb="lg">
        <Title order={1}>My Bids</Title>
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
                <ProductCard.Info>
                  <ProductCard.Title>{auction.productName}</ProductCard.Title>
                  <ProductCard.Badge>{auction.status}</ProductCard.Badge>
                </ProductCard.Info>
                <ProductCard.Stats>
                  <ProductCard.Stat label="Highest Bid" value={`$${Number(auction.highestBid).toFixed(2)}`} />
                </ProductCard.Stats>
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
