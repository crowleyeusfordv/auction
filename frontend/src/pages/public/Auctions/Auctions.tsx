import { useNavigate } from 'react-router';
import { ActionIcon, Box, Button, Group, Loader, Title, Tooltip } from '@mantine/core';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import { AuctionList } from '@/shared/components/AuctionList/AuctionList';
import { ROUTES } from '@/shared/constants/routes';
import type { Auction } from '@/features/auction/types/auction';
import { api } from '@/shared/api/api';

export default function Auctions() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get<{ items: Auction[] }>('/auctions')
            .then(res => setAuctions(res.items || []))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const goBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate(ROUTES.HOME);
    };

    if (isLoading) {
        return (
            <Box p="md" display="flex" style={{ justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader />
            </Box>
        );
    }

    return (
        <Box p="md" maw={800} mx="auto">
            <Group justify="space-between" align="center" mb="lg" wrap="nowrap">
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Back">
                        <ActionIcon
                            aria-label="Back"
                            variant="light"
                            color="dark"
                            size="lg"
                            radius="sm"
                            onClick={goBack}
                        >
                            <FiArrowLeft />
                        </ActionIcon>
                    </Tooltip>
                    <Title order={2}>Auction List</Title>
                </Group>
                <Button
                    leftSection={<FiShoppingBag />}
                    variant="light"
                    color="dark"
                    radius="sm"
                    onClick={() => navigate(ROUTES.BUYER.BIDS)}
                >
                    My Bids
                </Button>
            </Group>
            <AuctionList
                auctions={auctions}
                onWatch={(id) => navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(id))}
                emptyMessage="No auctions available"
            />
        </Box>
    );
}
