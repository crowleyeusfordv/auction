import { useEffect, useState } from 'react';
import { Container, Card, Image, Text, Button, Group, Center, Loader, Title } from '@mantine/core';
import { useNavigate, useParams } from 'react-router';
import { useAuthStore } from '@/shared/store/useAuthStore';

export function PaymentPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
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
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section>
          {orderInfo.productImage ? (
            <Image src={orderInfo.productImage} height={160} alt={orderInfo.productName} />
          ) : (
            <Center h={160} bg="gray.2">
              <Text c="dimmed">No Image</Text>
            </Center>
          )}
        </Card.Section>

        <Group justify="space-between" mt="md" mb="xs">
          <Text fw={500} size="lg">{orderInfo.productName}</Text>
          <Text fw={700} c="blue" size="xl">¥{orderInfo.finalPrice}</Text>
        </Group>

        <Text size="sm" c="dimmed" mb="xl">
          Order ID: {orderInfo.orderId}
        </Text>

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
      </Card>
    </Container>
  );
}
