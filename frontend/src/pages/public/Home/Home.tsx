import { Button, Center, Stack, Text } from "@mantine/core";
import { useCreateGuest } from "@/features/auth/hooks/useCreateGuest";

export default function Home() {
  const sellerMutation = useCreateGuest("seller");
  const buyerMutation = useCreateGuest("buyer");


  return (
    <Center h="100vh">
      <Stack w={288} gap="md">
        <Button
          id="btn-login-buyer"
          variant="filled"
          size="lg"
          radius="xl"
          loading={buyerMutation.isPending}
          onClick={() => buyerMutation.mutate()}
        >
          Login as guest buyer
        </Button>

        <Button
          id="btn-login-seller"
          variant="filled"
          color="green"
          size="lg"
          radius="xl"
          loading={sellerMutation.isPending}
          onClick={() => sellerMutation.mutate()}
        >
          Login as guest seller
        </Button>

        {sellerMutation.isError && (
          <Text c="red" size="sm" ta="center">
            {sellerMutation.error.message}
          </Text>
        )}
        {buyerMutation.isError && (
          <Text c="red" size="sm" ta="center">
            {buyerMutation.error.message}
          </Text>
        )}
      </Stack>
    </Center>
  );
}
