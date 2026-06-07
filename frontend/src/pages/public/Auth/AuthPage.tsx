import { Button, Center, Stack, Text } from "@mantine/core";
import { useCreateGuest } from "@/features/auth/hooks/useAuth";

export default function AuthPage() {
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
          以游客买家身份登录
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
          以游客卖家身份登录
        </Button>

        {sellerMutation.isError && (
          <Text c="red" size="sm" ta="center">
            登录失败，请稍后重试。
          </Text>
        )}
        {buyerMutation.isError && (
          <Text c="red" size="sm" ta="center">
            登录失败，请稍后重试。
          </Text>
        )}
      </Stack>
    </Center>
  );
}
