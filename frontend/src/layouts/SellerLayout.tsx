import { ROUTES } from '@/shared/constants/routes';
import { AppShell, Badge, Box, Burger, Button, Center, Group, Loader, Modal, NavLink, Paper, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import authApi from '@/features/auth/api/authApi';
import { useCreateGuest } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/shared/store/useAuthStore';

export default function SellerLayout() {
  const [opened, { toggle }] = useDisclosure();
  const [isSwitchSellerOpen, setIsSwitchSellerOpen] = useState(false);
  const location = useLocation();
  const localUser = useAuthStore((s) => s.sellerUser ?? (s.user?.role === 'seller' ? s.user : null));
  const setUser = useAuthStore((s) => s.setUser);
  const sellerMutation = useCreateGuest('seller');
  const shouldVerifyUser = !!localUser?.id && localUser.role === 'seller';
  const {
    data: verifiedUser,
    isPending: isVerifyingUser,
    isError: isVerifyError,
  } = useQuery({
    queryKey: ['user', localUser?.id],
    queryFn: () => authApi.getUser(localUser!.id),
    enabled: shouldVerifyUser,
    retry: false,
  });
  const {
    data: sellers = [],
    isPending: isLoadingSellers,
  } = useQuery({
    queryKey: ['sellers'],
    queryFn: authApi.listSellers,
  });
  const recommendedSeller = sellers.find((seller) => seller.auctionCount > 0) || sellers[0];
  const handleSellerSwitch = (sellerId: string) => {
    const seller = sellers.find((item) => item.id === sellerId);
    if (!seller) return;

    setUser({
      id: seller.id,
      name: seller.name,
      role: 'seller',
    });
    setIsSwitchSellerOpen(false);
  };

  const isSeller = localUser?.role === 'seller' && verifiedUser?.role === 'seller';
  const shouldShowGate = !localUser || localUser.role !== 'seller' || isVerifyError || (!!verifiedUser && verifiedUser.role !== 'seller');

  if (shouldVerifyUser && isVerifyingUser) {
    return (
      <Center h="100dvh" bg="gray.0">
        <Loader />
      </Center>
    );
  }

  if (!isSeller || shouldShowGate) {
    return (
      <Center h="100dvh" bg="gray.0" px="md">
        <Box bg="white" p="xl" maw={360} style={{ borderRadius: 8, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}>
          <Stack gap="md">
            <Title order={3}>需要卖家权限</Title>
            <Text c="dimmed" size="sm">
              当前浏览器正在使用买家会话，或卖家会话已过期。请以卖家身份登录后创建拍卖。
            </Text>
            {recommendedSeller && (
              <Button
                color="green"
                loading={isLoadingSellers}
                onClick={() => handleSellerSwitch(recommendedSeller.id)}
              >
                恢复有 {recommendedSeller.auctionCount} 场拍卖的卖家账号
              </Button>
            )}
            <Button
              variant={recommendedSeller ? 'light' : 'filled'}
              color="green"
              loading={sellerMutation.isPending}
              onClick={() => sellerMutation.mutate()}
            >
              以游客卖家身份登录
            </Button>
            <Button
              variant="light"
              color="dark"
              loading={isLoadingSellers}
              onClick={() => setIsSwitchSellerOpen(true)}
            >
              选择其他卖家
            </Button>
            {sellerMutation.isError && (
              <Text c="red" size="sm">
                登录失败，请稍后重试。
              </Text>
            )}
          </Stack>
        </Box>
        <Modal opened={isSwitchSellerOpen} onClose={() => setIsSwitchSellerOpen(false)} title="恢复卖家账号">
          <SellerRecoveryList sellers={sellers} isLoading={isLoadingSellers} onSelect={handleSellerSwitch} />
        </Modal>
      </Center>
    );
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
	          <Title order={3}>卖家后台</Title>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" visibleFrom="sm">
              {localUser?.name}
            </Text>
            <Button size="xs" variant="light" color="dark" onClick={() => setIsSwitchSellerOpen(true)}>
              切换卖家
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to={ROUTES.SELLER.AUCTIONS}
          label="我的拍卖"
          active={location.pathname.startsWith(ROUTES.SELLER.AUCTIONS)}
          variant="filled"
          style={{ borderRadius: 8, fontWeight: 'bold' }}
          mb="sm"
        />
        <NavLink
          component={Link}
          to={ROUTES.SELLER.ORDERS}
          label="订单"
          active={location.pathname.startsWith(ROUTES.SELLER.ORDERS)}
          variant="filled"
          style={{ borderRadius: 8, fontWeight: 'bold' }}
        />
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0" >
        <Outlet />
      </AppShell.Main>

      <Modal opened={isSwitchSellerOpen} onClose={() => setIsSwitchSellerOpen(false)} title="切换卖家">
        <SellerRecoveryList sellers={sellers} isLoading={isLoadingSellers} onSelect={handleSellerSwitch} />
      </Modal>
    </AppShell>
  );
}

function SellerRecoveryList({
  sellers,
  isLoading,
  onSelect,
}: {
  sellers: Awaited<ReturnType<typeof authApi.listSellers>>;
  isLoading: boolean;
  onSelect: (sellerId: string) => void;
}) {
  if (isLoading) {
    return (
      <Center h={160}>
        <Loader />
      </Center>
    );
  }

  if (sellers.length === 0) {
    return <Text c="dimmed">暂无可恢复的卖家账号。</Text>;
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        请根据拍卖记录选择卖家账号。第一个通常是你最近或最常使用的账号。
      </Text>
      {sellers.map((seller, index) => {
        const recentNames = seller.recentAuctions.map((auction) => auction.productName).filter(Boolean);

        return (
          <Paper key={seller.id} withBorder p="sm" radius="sm">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box style={{ minWidth: 0 }}>
                <Group gap="xs" mb={4}>
                  <Text fw={700}>{seller.name}</Text>
	                  {index === 0 && seller.auctionCount > 0 && <Badge color="green">推荐</Badge>}
                </Group>
                <Text size="sm" c="dimmed">
                  {seller.auctionCount} 场拍卖
                </Text>
                {recentNames.length > 0 && (
                  <Text size="sm" mt={4} lineClamp={2}>
                    {recentNames.join(', ')}
                  </Text>
                )}
              </Box>
              <Button size="xs" radius="sm" onClick={() => onSelect(seller.id)}>
                使用
              </Button>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
