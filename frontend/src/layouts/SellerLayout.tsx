import { ROUTES } from '@/shared/constants/routes';
import { AppShell, Box, Burger, Button, Center, Group, Loader, NavLink, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useLocation } from 'react-router';
import authApi from '@/features/auth/api/authApi';
import { useCreateGuest } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/shared/store/useAuthStore';

export default function SellerLayout() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const localUser = useAuthStore((s) => s.sellerUser ?? (s.user?.role === 'seller' ? s.user : null));
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
              当前浏览器没有可用的卖家会话。请以卖家身份登录后创建拍卖。
            </Text>
            <Button
              variant="filled"
              color="green"
              loading={sellerMutation.isPending}
              onClick={() => sellerMutation.mutate()}
            >
              以游客卖家身份登录
            </Button>
            {sellerMutation.isError && (
              <Text c="red" size="sm">
                登录失败，请稍后重试。
              </Text>
            )}
          </Stack>
        </Box>
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
          <Text size="sm" c="dimmed" visibleFrom="sm">
            {localUser?.name}
          </Text>
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

      <AppShell.Main bg="gray.0">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
