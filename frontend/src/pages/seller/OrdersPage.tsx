import { Title, Loader, Box, Text, Flex } from '@mantine/core';
import { useSellerOrders } from '../../features/auction/hooks/useAuctions';
import { OrdersList } from '../../features/auction/components/OrdersList';
import { useAuthStore } from '@/shared/store/useAuthStore';

export default function OrdersPage() {
  const sellerId = useAuthStore((s) => s.user?.id) as string;
  const { data: orders, isPending, isError, error } = useSellerOrders(sellerId);

  return (
    <Box p="md">
      <Title order={1} mb="xs">Orders</Title>
      <Text c="dimmed" mb="xl">Auctions completed and sales made.</Text>

      <Flex align='center' justify='center'>
        {isPending ? (
          <Loader size="xl" />
        ) : (
          <OrdersList orders={orders || []} />
        )}
        {isError && <Text c="red">{error.message}</Text>}
      </Flex>
    </Box>
  );
}
