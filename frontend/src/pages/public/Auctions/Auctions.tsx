import { useNavigate } from 'react-router';
import { Box } from '@mantine/core';
import { useEffect, useState } from 'react';
import { AuctionList } from '@/shared/components/AuctionList/AuctionList';
import { ROUTES } from '@/shared/constants/routes';
import type { BuyerAuction } from '@/features/auctions/buyer/types/auction.buyer';
import { api } from '@/shared/api/api';

export default function Auctions() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState<BuyerAuction[]>([]);

    useEffect(() => {
        api.get<{ items: BuyerAuction[] }>('/auctions')
            .then(res => setAuctions(res.items || []))
            .catch(console.error);
    }, []);

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
