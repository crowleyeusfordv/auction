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
            <Title order={3}>Seller access required</Title>
            <Text c="dimmed" size="sm">
              This browser is using a buyer session or an expired seller session. Log in as a seller to create auctions.
            </Text>
            {recommendedSeller && (
              <Button
                color="green"
                loading={isLoadingSellers}
                onClick={() => handleSellerSwitch(recommendedSeller.id)}
              >
                Recover seller with {recommendedSeller.auctionCount} auctions
              </Button>
            )}
            <Button
              variant={recommendedSeller ? 'light' : 'filled'}
              color="green"
              loading={sellerMutation.isPending}
              onClick={() => sellerMutation.mutate()}
            >
              Login as guest seller
            </Button>
            <Button
              variant="light"
              color="dark"
              loading={isLoadingSellers}
              onClick={() => setIsSwitchSellerOpen(true)}
            >
              Choose another seller
            </Button>
            {sellerMutation.isError && (
              <Text c="red" size="sm">
                {sellerMutation.error.message}
              </Text>
            )}
          </Stack>
        </Box>
        <Modal opened={isSwitchSellerOpen} onClose={() => setIsSwitchSellerOpen(false)} title="Recover seller">
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
          <Title order={3}>Admin</Title>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" visibleFrom="sm">
              {localUser?.name}
            </Text>
            <Button size="xs" variant="light" color="dark" onClick={() => setIsSwitchSellerOpen(true)}>
              Switch seller
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to={ROUTES.SELLER.AUCTIONS}
          label="MY AUCTIONS"
          active={location.pathname.startsWith(ROUTES.SELLER.AUCTIONS)}
          variant="filled"
          style={{ borderRadius: 8, fontWeight: 'bold' }}
          mb="sm"
        />
        <NavLink
          component={Link}
          to={ROUTES.SELLER.ORDERS}
          label="ORDERS"
          active={location.pathname.startsWith(ROUTES.SELLER.ORDERS)}
          variant="filled"
          style={{ borderRadius: 8, fontWeight: 'bold' }}
        />
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0" >
        <Outlet />
      </AppShell.Main>

      <Modal opened={isSwitchSellerOpen} onClose={() => setIsSwitchSellerOpen(false)} title="Switch seller">
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
    return <Text c="dimmed">No existing sellers found.</Text>;
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Pick the seller by auction history. The first one is usually the account you used most recently or most often.
      </Text>
      {sellers.map((seller, index) => {
        const recentNames = seller.recentAuctions.map((auction) => auction.productName).filter(Boolean);

        return (
          <Paper key={seller.id} withBorder p="sm" radius="sm">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box style={{ minWidth: 0 }}>
                <Group gap="xs" mb={4}>
                  <Text fw={700}>{seller.name}</Text>
                  {index === 0 && seller.auctionCount > 0 && <Badge color="green">Recommended</Badge>}
                </Group>
                <Text size="sm" c="dimmed">
                  {seller.auctionCount} auctions
                </Text>
                {recentNames.length > 0 && (
                  <Text size="sm" mt={4} lineClamp={2}>
                    {recentNames.join(', ')}
                  </Text>
                )}
              </Box>
              <Button size="xs" radius="sm" onClick={() => onSelect(seller.id)}>
                Use
              </Button>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
