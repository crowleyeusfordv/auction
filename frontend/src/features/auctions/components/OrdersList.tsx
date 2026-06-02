import { Text, Stack } from '@mantine/core';
import type { Order } from '@/features/auctions/types/auction';
import OrderCard from './OrderCard';

export function OrdersList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <Text c="dimmed">No orders found.</Text>;
  }

  return (
    <Stack gap="md">
      {orders.map((order) => (
        <span key={order.id}>
          <OrderCard {...order} />
        </span>
      ))}
    </Stack>
  );
}
