import { Box, Button, Drawer } from '@mantine/core';
import { LiveAuctionFeedItem, type LiveAuctionFeedItemProps } from './LiveAuctionFeedItem';
import imageExample from "@/assets/example_auction_product.webp"
import { useState } from 'react';

// Mock data to demonstrate scrolling (Task 2.3)
const MOCK_AUCTIONS = [
    {
        id: '1',
        mediaSrc: imageExample,
        mediaType: 'image' as const,
        viewerCount: 1205,
        productImage: imageExample,
        productName: 'Vintage Watch 1970',
        highestValue: '$ 1,200',
        messages: [
            { id: 'm1', sender: 'Bot', text: 'Auction started!' },
            { id: 'm2', sender: 'Alice', text: 'Beautiful watch!' },
        ],
    },
    {
        id: '2',
        mediaSrc: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=1000',
        mediaType: 'image' as const,
        viewerCount: 840,
        productImage: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=1000',
        productName: 'Abstract Art Canvas',
        highestValue: '$ 450',
        messages: [
            { id: 'm1', sender: 'Bot', text: 'Reserve price met!' },
            { id: 'm2', sender: 'Bob', text: 'I want this' },
        ],
    },
];

export function LiveAuctionFeed({ auctions }: { auctions: LiveAuctionFeedItemProps[] }) {
    auctions = MOCK_AUCTIONS;

    return (
        <Box
            id="feed-scroll-container"
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
