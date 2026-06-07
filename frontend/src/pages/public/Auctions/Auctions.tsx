import { useNavigate } from 'react-router';
import { Box, Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
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

    if (isLoading) {
        return (
            <Box p="md" display="flex" style={{ justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader />
            </Box>
        );
    }

    return (
        <Box p="md">
            <AuctionList
                auctions={auctions}
                onWatch={(id) => navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(id))}
                title="ALL AUCTIONS"
                emptyMessage="No auctions available"
            />
        </Box>
    );
}
