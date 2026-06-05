import { Box, Button, Drawer } from '@mantine/core';
import { LiveAuctionFeedItem, type LiveAuctionFeedItemProps } from './LiveAuctionFeedItem';
export function LiveAuctionFeed({ auctions, onLoadMore }: { auctions: LiveAuctionFeedItemProps[], onLoadMore?: () => void }) {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            onLoadMore?.();
        }
    };

    return (
        <Box
            id="feed-scroll-container"
            onScroll={handleScroll}
            w="100%"
            h="100vh"
            bg={'black'}
            className="overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
        >
            {auctions.map((auction) => (
                <LiveAuctionFeedItem key={auction.id} {...auction} onMenuClick={() => { }} />
            ))}
        </Box>
    );
}
