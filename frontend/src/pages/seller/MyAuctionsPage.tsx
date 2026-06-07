import { Button, Group, Title, Loader, Box, Stack, Text, Flex } from '@mantine/core';
import { useGetAuctions } from '../../features/auction/hooks/useAuctions';
import { useAuctionModals } from '../../features/auction/hooks/useAuctionModals';
import { CreateAuctionModal } from '../../features/auction/components/CreateAuctionModal';
import { EditAuctionModal } from '../../features/auction/components/EditAuctionModal';
import { CancelAuctionModal } from '../../features/auction/components/CancelAuctionModal';
import { useAuthStore } from '@/shared/store/useAuthStore';
import ProductCard from '@/shared/components/ProductCard';
import type { Auction } from '@/features/auction/types/auction';
import { getAuctionStatusLabel } from '@/shared/utils/labels';

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
  const sellerId = useAuthStore((s) => s.sellerUser?.id ?? (s.user?.role === 'seller' ? s.user.id : ''));
  const { data: auctionsData, isPending } = useGetAuctions({ seller_id: sellerId });
  const auctions = (auctionsData?.items || []) as Auction[];

  const ActiveModalComponent = activeModal ? MODAL_REGISTRY[activeModal] : null;

  return (
    <Box p="md">
      <Group justify="space-between" mb="lg">
        <Title order={1}>我的拍卖</Title>
        <Button onClick={openCreate}>创建拍卖</Button>
      </Group>

      {isPending ? (
        <Loader />
      ) : auctions.length === 0 ? (
        <Text c="dimmed">暂无拍卖。</Text>
      ) : (
        <Stack gap="md">
          {auctions.map((auction) => (
            <ProductCard key={auction.id}>
              <ProductCard.Image src={auction.imageUrl} w={100} h={80} />
              <ProductCard.Content>
                <Group justify="space-between" align="flex-start" wrap='nowrap'>

                  <ProductCard.Title truncate>{auction.productName}</ProductCard.Title>

                  <ProductCard.Stats mt='' align='right'>
                    <ProductCard.Stat label="起拍价" value={`¥${auction.startingBid}`} />
                    <ProductCard.Stat label="固定加价" value={`¥${auction.incrementValue}`} />
                    <ProductCard.Stat label="一口价" value={`¥${auction.buyOutPrice}`} />
                    <ProductCard.Stat label="当前出价" value={`¥${auction.currentBid}`} />
                    <ProductCard.Stat label="出价次数" value={auction.timesBidded} />
                  </ProductCard.Stats>


                </Group>
                <Flex justify='space-between' align='flex-end' mt='xs'>
                  <Group>
                    <Button variant="light" size="xs" onClick={() => openEdit(auction)} disabled={auction.status !== 'not_started'}>编辑拍卖</Button>
                    <Button variant="light" size="xs" onClick={() => openCancel(auction)} disabled={auction.status == 'cancelled' || auction.status == "completed"}>取消拍卖</Button>
                  </Group>
                  <ProductCard.Badge color={statusColorMap[auction.status] || 'gray'}>
                    {getAuctionStatusLabel(auction.status)}
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
