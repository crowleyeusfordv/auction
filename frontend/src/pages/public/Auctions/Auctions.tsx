import { useNavigate } from 'react-router';
import { ActionIcon, Box, Button, Group, Loader, Title, Tooltip } from '@mantine/core';
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiRefreshCw, FiShoppingBag } from 'react-icons/fi';
import { AuctionList } from '@/shared/components/AuctionList/AuctionList';
import { ROUTES } from '@/shared/constants/routes';
import { auctionsApi } from '@/features/auction/api/auctionsApi';
import { useAuctionFeedSocket } from '@/shared/hooks/useAuctionFeedSocket';

export default function Auctions() {
    const navigate = useNavigate();
    const [pendingUpdates, setPendingUpdates] = useState(0);
    const { data, isPending, refetch } = useQuery({
        queryKey: ['auctions', 'public-list'],
        queryFn: () => auctionsApi.getAuctions({ limit: '100' }),
    });
    const auctions = data?.items || [];

    const handleAuctionFeedUpdated = useCallback(() => {
        if (document.visibilityState === 'hidden') return;

        if (auctions.length === 0) {
            void refetch();
            return;
        }

        setPendingUpdates((current) => Math.min(current + 1, 99));
    }, [auctions.length, refetch]);

    useAuctionFeedSocket(handleAuctionFeedUpdated);

    const applyPendingUpdates = () => {
        setPendingUpdates(0);
        void refetch();
    };

    const goBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate(ROUTES.HOME);
    };

    if (isPending) {
        return (
            <Box p="md" display="flex" style={{ justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader />
            </Box>
        );
    }

    return (
        <Box p="md" maw={800} mx="auto">
            <Group justify="space-between" align="center" mb="lg" wrap="wrap">
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="返回">
                        <ActionIcon
                            aria-label="返回"
                            variant="light"
                            color="dark"
                            size="lg"
                            radius="sm"
                            onClick={goBack}
                        >
                            <FiArrowLeft />
                        </ActionIcon>
                    </Tooltip>
                    <Title order={2}>拍卖列表</Title>
                </Group>
                <Group gap="xs" wrap="nowrap">
                    {pendingUpdates > 0 && (
                        <Button
                            leftSection={<FiRefreshCw />}
                            variant="filled"
                            color="red"
                            radius="sm"
                            onClick={applyPendingUpdates}
                        >
                            {pendingUpdates} 条更新
                        </Button>
                    )}
                    <Button
                        leftSection={<FiShoppingBag />}
                        variant="light"
                        color="dark"
                        radius="sm"
                        onClick={() => navigate(ROUTES.BUYER.BIDS)}
                    >
                        我的出价
                    </Button>
                </Group>
            </Group>
            <AuctionList
                auctions={auctions}
                onWatch={(id) => navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(id))}
                emptyMessage="暂无可用拍卖"
            />
        </Box>
    );
}
