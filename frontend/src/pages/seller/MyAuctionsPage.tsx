import { Button, Group, Title, Loader, Box, Stack, Text, Flex } from '@mantine/core';
import { useGetAuctions } from '../../features/auction/hooks/useAuctions';
import { useAuctionModals } from '../../features/auction/hooks/useAuctionModals';
import { CreateAuctionModal } from '../../features/auction/components/CreateAuctionModal';
import { EditAuctionModal } from '../../features/auction/components/EditAuctionModal';
import { CancelAuctionModal } from '../../features/auction/components/CancelAuctionModal';
import { useAuthStore } from '@/shared/store/useAuthStore';
import ProductCard from '@/shared/components/ProductCard';
import type { Auction } from '@/features/auction/types/auction';

const statusColorMap: Record<string, string> = {
  completed: 'green',
  cancelled: 'red',
  on_going: 'blue',
  not_started: 'gray',
};

const MODAL_REGISTRY: Record<string, React.ElementType> = {
  create: CreateAuctionModal,
  edit: EditAuctionModal,
  cancel: CancelAuctionModal,
};

export default function MyAuctionsPage() {
  const { activeModal, selectedAuction, openCreate, openEdit, openCancel, closeModal } = useAuctionModals();
  const sellerId = useAuthStore((s) => s.user?.id) as string;
  const { data: auctionsData, isPending } = useGetAuctions({ seller_id: sellerId });
  const auctions = (auctionsData?.items || []) as Auction[];

  const ActiveModalComponent = activeModal ? MODAL_REGISTRY[activeModal] : null;

  return (
    <Box p="md">
      <Group justify="space-between" mb="lg">
        <Title order={1}>My Auctions</Title>
        <Button onClick={openCreate}>Create Auction</Button>
      </Group>

      {isPending ? (
        <Loader />
      ) : auctions.length === 0 ? (
        <Text c="dimmed">No auctions found.</Text>
      ) : (
        <Stack gap="md">
          {auctions.map((auction) => (
            <ProductCard key={auction.id}>
              <ProductCard.Image src={auction.imageUrl} w={100} h={80} />
              <ProductCard.Content>
                <Group justify="space-between" align="flex-start" wrap='nowrap'>

                  <ProductCard.Title truncate>{auction.productName}</ProductCard.Title>

                  <ProductCard.Stats mt='' align='right'>
                    <ProductCard.Stat label="Starting bid" value={`$${auction.startingBid}`} />
                    <ProductCard.Stat label="Fixed increment" value={`$${auction.incrementValue}`} />
                    <ProductCard.Stat label="Buy out" value={`$${auction.buyOutPrice}`} />
                    <ProductCard.Stat label="Current bid" value={`$${auction.currentBid}`} />
                    <ProductCard.Stat label="Times bidded" value={auction.timesBidded} />
                  </ProductCard.Stats>


                </Group>
                <Flex justify='space-between' align='flex-end' mt='xs'>
                  <Group>
                    <Button variant="light" size="xs" onClick={() => openEdit(auction)} disabled={auction.status !== 'not_started'}>Edit auction</Button>
                    <Button variant="light" size="xs" onClick={() => openCancel(auction)} disabled={auction.status == 'cancelled'}>Cancel auction</Button>
                  </Group>
                  <ProductCard.Badge color={statusColorMap[auction.status] || 'gray'}>
                    {auction.status}
                  </ProductCard.Badge>
                </Flex>
              </ProductCard.Content>
            </ProductCard>
          ))}
        </Stack>
      )}

      {ActiveModalComponent && (
        <ActiveModalComponent
          mode={activeModal}
          auction={selectedAuction}
          sellerId={sellerId}
          onClose={closeModal}
          opened={true}
        />
      )}
    </Box>
  );
}
