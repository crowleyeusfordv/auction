import { useEffect, useState } from 'react';
import { Container, Text, Button, Center, Loader, Title, Group } from '@mantine/core';
import { useParams } from 'react-router';
import { useAuthStore } from '@/shared/store/useAuthStore';
import ProductCard from '@/shared/components/ProductCard';

export function PaymentPage() {
  const { auctionId } = useParams();
  const user = useAuthStore((s) => s.buyerUser ?? (s.user?.role === 'buyer' ? s.user : null));
  
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/auctions/${auctionId}/order`)
      .then(res => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then(data => {
        setOrderInfo(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [auctionId]);

  const handlePay = async () => {
    if (!orderInfo || !user) return;
    setPaying(true);
    try {
      const res = await fetch(`http://localhost:8000/orders/${orderInfo.orderId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Payment failed');
      }
      alert('Payment successful!');
      setOrderInfo({ ...orderInfo, status: 'paid' });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <Center h="100vh"><Loader /></Center>;
  }

  if (error || !orderInfo) {
    return <Center h="100vh"><Text c="red">{error}</Text></Center>;
  }

  const isPaid = orderInfo.status === 'paid';

  return (
    <Container size="sm" mt={50}>
      <Title order={2} mb="xl" ta="center">Payment Details</Title>

      <ProductCard p="lg">
        <ProductCard.Image src={orderInfo.productImage} w={160} h={120} />
        <ProductCard.Content justify="space-between">
          <Group justify="space-between" align="flex-start">
            <Text fw={500} size="lg">{orderInfo.productName}</Text>
            <Text fw={700} c="blue" size="xl">¥{orderInfo.finalPrice}</Text>
          </Group>

          <Text size="sm" c="dimmed">
            Order ID: {orderInfo.orderId}
          </Text>

          <Group>
            <Button 
              fullWidth 
              size="lg" 
              color={isPaid ? "green" : "blue"}
              disabled={isPaid || orderInfo.buyerId !== user?.id}
              loading={paying}
              onClick={handlePay}
            >
              {isPaid ? "PAID" : "PAY NOW"}
            </Button>
          </Group>
        </ProductCard.Content>
      </ProductCard>
    </Container>
  );
}
