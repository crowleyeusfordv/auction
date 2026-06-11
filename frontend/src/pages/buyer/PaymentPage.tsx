import { useEffect, useState } from 'react';
import { Container, Text, Button, Center, Loader, Title, Group } from '@mantine/core';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { useAuthStore } from '@/shared/store/useAuthStore';
import ProductCard from '@/shared/components/ProductCard';
import { buildApiUrl } from '@/shared/config/urls';
import { ROUTES } from '@/shared/constants/routes';

export function PaymentPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.buyerUser ?? (s.user?.role === 'buyer' ? s.user : null));
  
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(buildApiUrl(`/auctions/${auctionId}/order`))
      .then(res => {
        if (!res.ok) throw new Error('未找到订单');
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
      const res = await fetch(buildApiUrl(`/orders/${orderInfo.orderId}/pay`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || '支付失败');
      }
      toast.success('已支付成功', { position: 'top-center' });
      setOrderInfo((prev: any) => (prev ? { ...prev, status: 'paid' } : prev));
    } catch {
      alert('支付失败，请稍后重试。');
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
      <Group justify={isPaid ? "space-between" : "center"} align="center" mb="xl">
        <Title order={2} ta="center">{isPaid ? '支付成功' : '支付详情'}</Title>
        {isPaid ? (
          <Button variant="subtle" onClick={() => navigate(ROUTES.AUCTIONS.ROOT, { replace: true })}>
            确认
          </Button>
        ) : null}
      </Group>

      <ProductCard p="lg">
        <ProductCard.Image src={orderInfo.productImage} w={160} h={120} />
        <ProductCard.Content justify="space-between">
          <Group justify="space-between" align="flex-start">
            <Text fw={500} size="lg">{orderInfo.productName}</Text>
            <Text fw={700} c="blue" size="xl">¥{orderInfo.finalPrice}</Text>
          </Group>

          <Text size="sm" c="dimmed">
            订单编号：{orderInfo.orderId}
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
              {isPaid ? "已支付" : "确认支付"}
            </Button>
          </Group>
        </ProductCard.Content>
      </ProductCard>
    </Container>
  );
}
