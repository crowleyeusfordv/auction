import { Modal, Text, Button, Group } from '@mantine/core';
import { useCancelAuction } from '../hooks/useAuctions';
import type { Auction } from '@/features/auction/types/auction';

export function CancelAuctionModal({ opened, onClose, auction }: { opened?: boolean; onClose: () => void; auction?: Auction | null; mode?: string; sellerId?: string }) {
  const { mutate: cancelAuction, isPending } = useCancelAuction();

  if (!auction) return null;

  return (
    <Modal opened={!!opened} onClose={onClose} title="取消拍卖">
      <Text>确定要取消这场拍卖吗？</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>不，保留</Button>
        <Button color="red" loading={isPending} onClick={() => cancelAuction(auction.id, { onSuccess: onClose })}>确认取消</Button>
      </Group>
    </Modal>
  );
}
