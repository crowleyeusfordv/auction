import { Button, CloseButton, Flex, Text } from '@mantine/core';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';
import { Sheet } from '@/shared/components/Sheet';
import ProductCard from '@/shared/components/ProductCard';

export interface CancelledNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionName: string;
  imageUrl: string;
}

export function CancelledNotificationModal({
  isOpen,
  onClose,
  auctionName,
  imageUrl,
}: CancelledNotificationModalProps) {
  const navigate = useNavigate();

  const handleConfirm = () => {
    onClose();
    navigate(ROUTES.AUCTIONS.ROOT);
  };

  return (
    <Sheet isOpen={isOpen} onClose={handleConfirm} position="center">
      <CloseButton pos="absolute" top={16} right={16} onClick={handleConfirm} variant="subtle" />
      <Flex direction="column" gap="md" align="center" pt="md">
        <Text fw={800} size="xl" ta="center" c="gray.7">
          拍卖已取消
        </Text>
        <Text size="sm" ta="center" c="dimmed">
          卖家取消了这场拍卖。本次拍卖作废，没有获胜者。
        </Text>

        <ProductCard w="100%">
          <ProductCard.Image src={imageUrl} />
          <ProductCard.Content>
            <ProductCard.Title>{auctionName}</ProductCard.Title>
            <ProductCard.Stats>
              <ProductCard.Stat label="状态" value="已取消" />
            </ProductCard.Stats>
          </ProductCard.Content>
        </ProductCard>

        <Button fullWidth onClick={handleConfirm} size="lg" color="gray.7">
          知道了
        </Button>
      </Flex>
    </Sheet>
  );
}
