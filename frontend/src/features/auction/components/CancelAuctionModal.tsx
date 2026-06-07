import { Modal, Text, Button, Group } from '@mantine/core';
import { useCancelAuction } from '../hooks/useAuctions';
import type { Auction } from '@/features/auction/types/auction';

export function CancelAuctionModal({ opened, onClose, auction }: { opened?: boolean; onClose: () => void; auction?: Auction | null; mode?: string; sellerId?: string }) {
  const { mutate: cancelAuction, isPending } = useCancelAuction();

  if (!auction) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Cancel Auction">
      <Text>Are you sure you want to cancel this auction?</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>No, keep it</Button>
        <Button color="red" loading={isPending} onClick={() => cancelAuction(auction.id, { onSuccess: onClose })}>Yes, cancel it</Button>
      </Group>
    </Modal>
  );
}
