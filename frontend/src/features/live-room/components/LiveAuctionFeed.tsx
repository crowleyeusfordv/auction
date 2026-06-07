import { Box } from '@mantine/core';
import { LiveAuctionFeedItem, type LiveAuctionFeedItemProps } from './LiveAuctionFeedItem';
export function LiveAuctionFeed({ auctions, onLoadMore, onAuctionEnd }: { auctions: LiveAuctionFeedItemProps[], onLoadMore?: () => void, onAuctionEnd?: (index: number) => void }) {
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
            {auctions.map((auction, index) => (
                <LiveAuctionFeedItem key={auction.id} {...auction} onMenuClick={() => { }} onAuctionEnded={() => onAuctionEnd?.(index)} />
            ))}
        </Box>
    );
}
