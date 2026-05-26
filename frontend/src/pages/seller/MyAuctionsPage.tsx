import { Button, Group, Title, Loader, Box, Stack, Text } from '@mantine/core';
import { useSellerAuctions } from '../../features/auctions/hooks/useAuctions';
import { useAuctionModals } from '../../features/auctions/hooks/useAuctionModals';
import { AuctionCard } from '../../features/auctions/components/AuctionCard';
import { CreateAuctionModal } from '../../features/auctions/components/CreateAuctionModal';
import { EditAuctionModal } from '../../features/auctions/components/EditAuctionModal';
import { CancelAuctionModal } from '../../features/auctions/components/CancelAuctionModal';

import { userStorage } from '@/shared/store/userStorage';

export default function MyAuctionsPage() {
  const { activeModal, selectedAuction, openCreate, openEdit, openCancel, closeModal } = useAuctionModals();
  const { id: sellerId } = userStorage.get("seller")
  const { data: auctions, isPending } = useSellerAuctions(sellerId);

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
            <AuctionCard key={auction.id} auction={auction} onEdit={openEdit} onCancel={openCancel} />
          ))}
        </Stack>
      )}

      <CreateAuctionModal opened={activeModal === 'create'} onClose={closeModal} sellerId={sellerId} />
      <EditAuctionModal opened={activeModal === 'edit'} onClose={closeModal} auction={selectedAuction} />
      <CancelAuctionModal opened={activeModal === 'cancel'} onClose={closeModal} auction={selectedAuction} />
    </Box>
  );
}
