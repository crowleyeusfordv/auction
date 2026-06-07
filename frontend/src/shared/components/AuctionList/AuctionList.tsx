import { Box, Text, Paper, SegmentedControl, Divider, Pagination, Center, Button } from '@mantine/core';
import { useMemo, useState, useEffect } from 'react';
import { FiRadio } from 'react-icons/fi';
import ProductCard from '@/shared/components/ProductCard';
import type { Auction } from '@/features/auction/types/auction';
import { getAuctionStatusLabel } from '@/shared/utils/labels';

export interface AuctionListProps {
  auctions: Auction[];
  onWatch: (auctionId: string) => void;
  title?: React.ReactNode;
  emptyMessage?: string;
  itemsPerPage?: number;
}

export function AuctionList({
  auctions,
  onWatch,
  title,
  emptyMessage = "暂无可用拍卖",
  itemsPerPage = 4
}: AuctionListProps) {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1);
  };

  const filteredAuctions = useMemo(() => {
    if (filter === 'all') return auctions;
    return auctions.filter(a => {
      if (filter === 'ongoing') return a.status === 'on_going';
      if (filter === 'upcoming') return a.status === 'not_started';
      if (filter === 'ended') return a.status === 'completed' || a.status === 'cancelled';
      return false;
    });
  }, [auctions, filter]);

  const flattened = useMemo(() => {
    const ongoing = filteredAuctions.filter(a => a.status === 'on_going');
    const upcoming = filteredAuctions.filter(a => a.status === 'not_started');
    const ended = filteredAuctions.filter(a => a.status === 'completed' || a.status === 'cancelled');

    return [
      ...ongoing.map(a => ({ ...a, category: '进行中' })),
      ...upcoming.map(a => ({ ...a, category: '即将开始' })),
      ...ended.map(a => ({ ...a, category: '已结束' }))
    ];
  }, [filteredAuctions]);

  const totalPages = Math.max(1, Math.ceil(flattened.length / itemsPerPage));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const currentItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return flattened.slice(start, start + itemsPerPage);
  }, [flattened, page, itemsPerPage]);

  let lastCategory = '';
  const statusColorMap: Record<string, string> = {
    completed: 'green',
    cancelled: 'red',
    on_going: 'blue',
    not_started: 'gray',
  };

  return (
    <>
      <Box mb="md">
        {title && (
          <Text fw={800} size="lg" ta="center" tt="uppercase" lh={1.1}>
            {title}
          </Text>
        )}
        <Center mt={title ? "md" : 0}>
          <SegmentedControl
            radius="xl"
            value={filter}
            onChange={handleFilterChange}
            data={[
              { label: '全部', value: 'all' },
              { label: '进行中', value: 'ongoing' },
              { label: '即将开始', value: 'upcoming' },
              { label: '已结束', value: 'ended' },
            ]}
          />
        </Center>
      </Box>

      <Paper bg="white" p="sm" radius="md" mih={300}>
        {flattened.length === 0 ? (
          <Center h={200}>
            <Text c="gray.5" fw={500}>{emptyMessage}</Text>
          </Center>
        ) : (
          <>
            {currentItems.map((item) => {
              const showCategory = item.category !== lastCategory;
              lastCategory = item.category;

              return (
                <Box key={item.id}>
                  {showCategory && (
                    <Box mt={showCategory && currentItems[0] !== item ? "md" : 0} mb="xs">
                      <Text fw={800} size="sm" ta="left" tt="uppercase" c="gray.7">{item.category}</Text>
                      <Divider my="xs" />
                    </Box>
                  )}
                  <ProductCard>
                    <ProductCard.Image src={item.imageUrl} />
                    <ProductCard.Content>
                      <ProductCard.Title>{item.productName}</ProductCard.Title>
                      <ProductCard.Stats>
                        <ProductCard.Stat label="当前出价" value={`¥${item.currentBid ?? item.startingBid ?? 0}`} />
                      </ProductCard.Stats>
                    </ProductCard.Content>
                    {item.status === 'on_going' ? (
                      <Button
                        leftSection={<FiRadio />}
                        size="xs"
                        radius="sm"
                        onClick={() => onWatch(item.id)}
                        mt="auto"
                      >
                        进入直播间
                      </Button>
                    ) : (
                      <ProductCard.Badge color={statusColorMap[item.status] || 'gray'} style={{ alignSelf: 'flex-start' }}>
                        {getAuctionStatusLabel(item.status)}
                      </ProductCard.Badge>
                    )}
                  </ProductCard>
                </Box>
              );
            })}
          </>
        )}
      </Paper>

      {flattened.length > 0 && totalPages > 1 && (
        <Center mt="md">
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            radius="xl"
          />
        </Center>
      )}
    </>
  );
}
