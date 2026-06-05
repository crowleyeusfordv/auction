import { useNavigate } from 'react-router';
import { Box } from '@mantine/core';
import { AuctionList } from '@/shared/components/AuctionList/AuctionList';
import { ROUTES } from '@/shared/constants/routes';
import type { BuyerAuction } from '@/features/auctions/buyer/types/auction.buyer';

// MOCK DATA for now until API is ready
const MOCK_GLOBAL_AUCTIONS: BuyerAuction[] = [
    { id: '1', productName: 'Vintage Watch', imageUrl: 'https://placehold.co/100', currentBid: 1500, myLastBid: 0, status: 'on going', sellerName: 'Store 1', scheduledTimeToStart: new Date().toISOString() },
    { id: '2', productName: 'Rare Coin', imageUrl: 'https://placehold.co/100', currentBid: 500, myLastBid: 450, status: 'upcoming', sellerName: 'Store 2', scheduledTimeToStart: new Date().toISOString() },
];

export default function Auctions() {
    const navigate = useNavigate();

    return (
        <Box p="md">
            <AuctionList
                auctions={MOCK_GLOBAL_AUCTIONS}
                onWatch={(id) => navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(id))}
                title="ALL AUCTIONS"
                emptyMessage="No auctions available"
            />
        </Box>
    );
}
