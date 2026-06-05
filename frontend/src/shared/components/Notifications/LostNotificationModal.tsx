import { Text, Button, Flex } from '@mantine/core';
import { Sheet } from '@/shared/components/Sheet';
import ProductCard from '@/shared/components/ProductCard';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';

export interface LostNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionName: string;
  imageUrl: string;
  finalAmount: number;
}

export function LostNotificationModal({
  isOpen,
  onClose,
  auctionName,
  imageUrl,
  finalAmount,
}: LostNotificationModalProps) {
  const navigate = useNavigate();

  const handleSeeSimilar = () => {
    onClose();
    navigate(ROUTES.AUCTIONS.ROOT);
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} position="center">
      <Flex direction="column" gap="md" align="center">
        <Text fw={800} size="xl" ta="center" c="red.6">
          UNFORTUNATELY, YOU LOST THE AUCTION
        </Text>
        <Text size="sm" ta="center" c="dimmed">
          Another user bought it
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

        <Button fullWidth onClick={handleSeeSimilar} size="lg" variant="outline" color="red.6">
          SEE SIMILAR AUCTIONS
        </Button>
      </Flex>
    </Sheet>
  );
}
