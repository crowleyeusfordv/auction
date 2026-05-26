import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Outlet, useLocation } from 'react-router';

export default function SellerLayout() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>Admin</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to="/seller/auctions"
          label="MY AUCTIONS"
          active={location.pathname.startsWith('/seller/auctions')}
          variant="filled"
          style={{ borderRadius: 8, fontWeight: 'bold' }}
          mb="sm"
        />
        <NavLink
          component={Link}
          to="/seller/orders"
          label="ORDERS"
          active={location.pathname.startsWith('/seller/orders')}
          variant="filled"
          style={{ borderRadius: 8, fontWeight: 'bold' }}
        />
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0" >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
