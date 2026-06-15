import { Flex, Loader } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { LiveAuctionFeed } from '../features/live-room/components/LiveAuctionFeed';
import type { LiveAuctionFeedItemProps } from '../features/live-room/components/LiveAuctionFeedItem';
import type { Auction } from '@/features/auction/types/auction';
import { api } from '@/shared/api/api';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

export default function LiveRoomPage() {
  const { auction_id } = useParams<{ auction_id: string }>();
  const [auctions, setAuctions] = useState<LiveAuctionFeedItemProps[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const fetchedRef = useRef(false);
  const navigate = useNavigate();

  const scrollToIndex = (idx: number) => {
    setTimeout(() => {
      const container = document.getElementById('feed-scroll-container');
      if (container && container.children[idx]) {
        container.children[idx].scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const mapToFeedItem = (a: any): LiveAuctionFeedItemProps => ({
    id: a.id,
    mediaSrc: a.videoUrl || a.video_url || a.imageUrl || a.image_url || undefined,
    mediaType: (a.videoUrl || a.video_url) ? 'video' : 'image',
    viewerCount: 0,
    productImage: a.imageUrl || a.image_url || undefined,
    productName: a.productName || a.product_name || '',
    highestValue: String(a.currentBid ?? a.startingBid ?? a.starting_bid ?? 0),
    buyOutPrice: toNumberOrNull(a.buyOutPrice ?? a.buy_out_price),
    messages: [],
    sellerId: a.sellerId ?? a.seller_id ?? '',
    onMenuClick: () => { }
  });

  const loadInitial = async () => {
    setLoading(true);
    try {
      const initialItems: LiveAuctionFeedItemProps[] = [];

      // 1. Fetch specific auction from URL if exists
      if (auction_id) {
        try {
          const targetAuction = await api.get<any>(`/auctions/${auction_id}`);
          initialItems.push(mapToFeedItem(targetAuction));
        } catch (e) {
          console.error("Error fetching target auction", e);
        }
      }

      // 2. Fetch the feed
      const feedUrl = auction_id ? `/auctions?status=on_going&excludeId=${auction_id}` : '/auctions?status=on_going';
      const res = await api.get<{ items: Auction[], pagination: { nextCursor: string | null, hasMore: boolean } }>(feedUrl);

      const feedItems = (res.items || []).map(mapToFeedItem);

      setAuctions([...initialItems, ...feedItems]);
      setCursor(res.pagination?.nextCursor || null);
      setHasMore(res.pagination?.hasMore ?? false);
    } catch (e) {
      console.error('Failed to load initial feed:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore || !cursor) return;
    try {
      setLoading(true);
      const url = auction_id 
        ? `/auctions?cursor=${encodeURIComponent(cursor)}&excludeId=${auction_id}`
        : `/auctions?cursor=${encodeURIComponent(cursor)}`;
      const res = await api.get<{ items: Auction[], pagination: { next_cursor: string | null, has_more: boolean } }>(url);
      const newItems = (res.items || []).map(mapToFeedItem);

      setAuctions(prev => [...prev, ...newItems]);
      setCursor(res.pagination?.next_cursor || null);
      setHasMore(res.pagination?.has_more ?? false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeAuctionAndAdjustScroll = (indexToRemove: number, direction: 'up' | 'down') => {
    if (direction === 'down') {
      const container = document.getElementById('feed-scroll-container');
      if (container) {
        container.classList.remove('scroll-smooth');
        container.scrollTop -= window.innerHeight;
        requestAnimationFrame(() => {
          container.classList.add('scroll-smooth');
        });
      }
    }
    setAuctions(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAuctionEnd = async (currentIndex: number) => {
    if (auctions.length === 1 && !hasMore) {
      navigate(ROUTES.AUCTIONS.ROOT);
      return;
    }

    if (currentIndex === auctions.length - 1) {
      if (hasMore) {
        await loadMore();
        setTimeout(() => {
          scrollToIndex(currentIndex + 1);
          setTimeout(() => removeAuctionAndAdjustScroll(currentIndex, 'down'), 800);
        }, 300);
      } else {
        scrollToIndex(currentIndex - 1);
        setTimeout(() => removeAuctionAndAdjustScroll(currentIndex, 'up'), 800);
      }
    } else {
      scrollToIndex(currentIndex + 1);
      setTimeout(() => removeAuctionAndAdjustScroll(currentIndex, 'down'), 800);
    }
  };

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      loadInitial();
    }
  }, []);

  if (loading && auctions.length === 0) {
    return (
      <Flex w="100%" h="100dvh" align="center" justify="center" bg="black">
        <Loader color="white" />
      </Flex>
    );
  }

  return (
    <LiveAuctionFeed auctions={auctions} onLoadMore={loadMore} onAuctionEnd={handleAuctionEnd} />
  );
}
