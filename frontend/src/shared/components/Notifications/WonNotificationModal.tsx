import { Text, Button, Flex } from '@mantine/core';
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
      <Flex direction="column" gap="md" align="center">
        <Text fw={800} size="xl" ta="center" c="green.6">
          CONGRATS! YOU WON THE AUCTION
        </Text>

        <ProductCard w="100%">
          <ProductCard.Image src={imageUrl} />
          <ProductCard.Info>
            <ProductCard.Title>{auctionName}</ProductCard.Title>
            <ProductCard.Stats>
              <ProductCard.Stat label="Final Amount" value={`¥${finalAmount}`} />
            </ProductCard.Stats>
          </ProductCard.Info>
        </ProductCard>

        <Button fullWidth onClick={handlePay} size="lg" color="green.6">
          CLICK HERE TO PAY
        </Button>
      </Flex>
    </Sheet>
  );
}
