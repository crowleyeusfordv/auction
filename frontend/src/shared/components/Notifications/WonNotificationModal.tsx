import { Text, Button, Flex, CloseButton } from '@mantine/core';
import { Sheet } from '@/shared/components/Sheet';
import ProductCard from '@/shared/components/ProductCard';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';

export interface WonNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  auctionName: string;
  imageUrl: string;
  finalAmount: number;
}

export function WonNotificationModal({
  isOpen,
  onClose,
  auctionId,
  auctionName,
  imageUrl,
  finalAmount,
}: WonNotificationModalProps) {
  const navigate = useNavigate();

  const handlePay = () => {
    onClose();
    navigate(ROUTES.AUCTIONS.PAYMENT_DYNAMIC_PATH(auctionId));
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} position="center">
      <CloseButton pos="absolute" top={16} right={16} onClick={onClose} variant="subtle" />
      <Flex direction="column" gap="md" align="center" pt="md">
        <Text fw={800} size="xl" ta="center" c="green.6">
          恭喜，你拍中了！
        </Text>

        <ProductCard w="100%">
          <ProductCard.Image src={imageUrl} />
          <ProductCard.Content>
            <ProductCard.Title>{auctionName}</ProductCard.Title>
            <ProductCard.Stats>
              <ProductCard.Stat label="成交金额" value={`¥${finalAmount}`} />
            </ProductCard.Stats>
          </ProductCard.Content>
        </ProductCard>

        <Button fullWidth onClick={handlePay} size="lg" color="green.6">
          去支付
        </Button>
      </Flex>
    </Sheet>
  );
}
