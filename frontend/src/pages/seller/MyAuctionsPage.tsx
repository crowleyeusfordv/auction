import { Button, Group, Title, Loader, Box, Stack, Text } from '@mantine/core';
import { useGetAuctions } from '../../features/auctions/hooks/useAuctions';
import { useAuctionModals } from '../../features/auctions/hooks/useAuctionModals';
import { SellerAuctionCard } from '../../features/auctions/components/AuctionCard';
import { CreateAuctionModal } from '../../features/auctions/components/CreateAuctionModal';
import { CancelAuctionModal } from '../../features/auctions/components/CancelAuctionModal';

import { SellerEditAuctionModal } from '@/features/auctions/components/EditAuctionModal';
import { useAuthStore } from '@/shared/store/useAuthStore';
import type { SellerAuction } from '@/features/auctions/types/auction';

export default function MyAuctionsPage() {
  const { activeModal, selectedAuction, openCreate, openEdit, openCancel, closeModal } = useAuctionModals();
  const sellerId = useAuthStore((s) => s.user?.id) as string;
  const { data: auctionsData, isPending } = useGetAuctions({seller_id: sellerId});
  const auctions = (auctionsData?.items || []) as SellerAuction[];

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
            <SellerAuctionCard key={auction.id} auction={auction} onEdit={openEdit} onCancel={openCancel} />
          ))}
        </Stack>
      )}

      <CreateAuctionModal opened={activeModal === 'create'} onClose={closeModal} sellerId={sellerId} />
      <SellerEditAuctionModal opened={activeModal === 'edit'} onClose={closeModal} auction={selectedAuction} />
      <CancelAuctionModal opened={activeModal === 'cancel'} onClose={closeModal} auction={selectedAuction} />
    </Box>
  );
}
