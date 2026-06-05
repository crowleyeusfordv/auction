import { Card, Group, Image, Text, Button, Badge, Stack, Grid, Box, Title, Flex } from '@mantine/core';
import type { SellerAuction } from '@/features/auctions/types/auction';

interface SellerAuctionCardProps {
  auction: SellerAuction;
  onEdit: (auction: SellerAuction) => void;
  onCancel: (auction: SellerAuction) => void;
}

export function SellerAuctionCard({ auction, onEdit, onCancel }: SellerAuctionCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder >
      <Grid>
        <Grid.Col span={2}>
          <Image
            src={auction.imageUrl || 'https://placehold.co/200x200?text=No+Image'}
            height={50}
            alt={auction.productName}
            radius="md"
            fallbackSrc="https://placehold.co/200x200?text=No+Image"
          />
        </Grid.Col>
        <Grid.Col span={10}>
          <Stack gap="xs" h="100%" justify="space-between">
            <Group justify="space-between" align="flex-start">
              <Box>
                <Title order={4}>{auction.productName}</Title>
                <Flex mt="sm" gap="xl">
                  <Box><Text size="xs" c="dimmed">Starting bid</Text><Text fw={500}>${auction.startingBid}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Fixed increment</Text><Text fw={500}>${auction.incrementValue}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Buy out</Text><Text fw={500}>${auction.buyOutPrice}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Current bid</Text><Text fw={500}>${auction.currentBid}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Times bidded</Text><Text fw={500}>{auction.timesBidded}</Text></Box>
                </Flex>
              </Box>
              <Badge
                color={
                  auction.status === 'completed' ? 'green' :
                    auction.status === 'cancelled' ? 'red' :
                      auction.status === 'on going' ? 'blue' : 'gray'
                }
              >
                {auction.status}
              </Badge>
            </Group>

            <Group>
              <Button variant="light" size="xs" onClick={() => onEdit(auction)}>Edit auction</Button>
              <Button variant="light" color="red" size="xs" onClick={() => onCancel(auction)}>Cancel auction</Button>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  );
}
