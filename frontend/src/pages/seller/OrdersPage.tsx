import { Title, Loader, Box, Text, Flex } from '@mantine/core';
import { useSellerOrders } from '../../features/auction/hooks/useAuctions';
import { OrdersList } from '../../features/auction/components/OrdersList';
import { useAuthStore } from '@/shared/store/useAuthStore';

export default function OrdersPage() {
  const sellerId = useAuthStore((s) => s.sellerUser?.id ?? (s.user?.role === 'seller' ? s.user.id : ''));
  const { data: orders, isPending, isError } = useSellerOrders(sellerId);

  return (
    <Box p="md">
      <Title order={1} mb="xs">订单</Title>
      <Text c="dimmed" mb="xl">已完成的拍卖和成交记录。</Text>

      <Flex align='center' justify='center'>
        {isPending ? (
          <Loader size="xl" />
        ) : (
          <OrdersList orders={orders || []} />
        )}
        {isError && <Text c="red">订单加载失败，请稍后重试。</Text>}
      </Flex>
    </Box>
  );
}
