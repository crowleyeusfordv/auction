import { Title, Loader, Box, Text, Flex } from '@mantine/core';
import { useSellerOrders } from '../../features/auctions/hooks/useAuctions';
import { OrdersList } from '../../features/auctions/components/OrdersList';
import { userStorage } from '@/shared/store/userStorage';

export default function OrdersPage() {
  const { id: sellerId } = userStorage.get("seller");
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
