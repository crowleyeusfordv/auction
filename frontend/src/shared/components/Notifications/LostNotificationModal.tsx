import { Text, Button, Flex, CloseButton } from '@mantine/core';
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
      <CloseButton pos="absolute" top={16} right={16} onClick={onClose} variant="subtle" />
      <Flex direction="column" gap="md" align="center" pt="md">
        <Text fw={800} size="xl" ta="center" c="red.6">
          很遗憾，你未拍中
        </Text>
        <Text size="sm" ta="center" c="dimmed">
          该商品已由其他用户拍下
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

        <Button fullWidth onClick={handleSeeSimilar} size="lg" variant="outline" color="red.6">
          查看其他拍卖
        </Button>
      </Flex>
    </Sheet>
  );
}
