import { Box, Button, Image, Stack, Text, Title } from "@mantine/core";
import { useCreateGuest } from "@/features/auth/hooks/useAuth";
import { RiLock2Fill } from "react-icons/ri";

const middleIllustration = new URL("../../../../pictures/middle_change.png", import.meta.url).href;
const leftIllustration = new URL("../../../../pictures/left.png", import.meta.url).href;
const rightIllustration = new URL("../../../../pictures/right.png", import.meta.url).href;

const pageBackground = "#EBECF0";
const shadowColor = "#BABECC";
const whiteColor = "#FFF";
const buyerColor = "#AE1100";
const sellerColor = "#2F9E44";

const loginButtonStyles = (textColor: string) => ({
  root: {
    width: "100%",
    height: 72,
    borderRadius: 999,
    background: pageBackground,
    color: textColor,
    boxShadow: `-8px -8px 18px ${whiteColor}, 8px 8px 18px ${shadowColor}`,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    border: "none",
    transition: "all 0.2s ease-in-out",
  },
  inner: {
    justifyContent: "center",
    gap: 14,
  },
  label: {
    overflow: "visible",
  },
});

export default function AuthPage() {
  const sellerMutation = useCreateGuest("seller");
  const buyerMutation = useCreateGuest("buyer");

  return (
    <Box
      mih="100vh"
      pos="relative"
      style={{
        overflow: "hidden",
        background: pageBackground,
      }}
    >
      <Image
        src={middleIllustration}
        alt="直播竞拍平台"
        w={{ base: 90, sm: 120, md: 140 }}
        pos="absolute"
        top={{ base: 18, sm: 28, md: 36 }}
        left="50%"
        style={{
          transform: "translateX(-50%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <Image
        src={leftIllustration}
        alt="拍卖锤"
        w={{ base: 135, sm: 205, md: 270 }}
        pos="absolute"
        left={{ base: -8, sm: 18, md: 36 }}
        bottom={{ base: 16, sm: 24, md: 32 }}
        style={{
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <Image
        src={rightIllustration}
        alt="竞拍人物"
        w={{ base: 120, sm: 185, md: 245 }}
        pos="absolute"
        right={{ base: -8, sm: 18, md: 36 }}
        bottom={{ base: 10, sm: 18, md: 24 }}
        style={{
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <Box
        mih="100vh"
        px="md"
        py={{ base: 140, sm: 176, md: 190 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Stack
          w="100%"
          maw={700}
          gap="xl"
          align="center"
          style={{
            textAlign: "center",
          }}
        >
          <Stack gap={8} align="center">
            <Title
              order={1}
              style={{
                color: "#6B7280",
                fontSize: "clamp(2rem, 3vw, 3rem)",
                letterSpacing: "-0.03em",
                textShadow: `1px 1px 1px ${whiteColor}`,
              }}
            >
              直播竞拍平台
            </Title>
            <Text
              size="lg"
              style={{
                color: "#8B95A7",
                textShadow: `1px 1px 1px ${whiteColor}`,
              }}
            >
              选择身份进入竞拍系统
            </Text>
          </Stack>

          <Stack w="100%" maw={640} gap="lg">
            <Button
              id="btn-login-buyer"
              variant="filled"
              size="xl"
              radius="xl"
              loading={buyerMutation.isPending}
              onClick={() => buyerMutation.mutate()}
              leftSection={<RiLock2Fill size={28} />}
              styles={loginButtonStyles(buyerColor)}
            >
              以游客买家身份登录
            </Button>

            <Button
              id="btn-login-seller"
              variant="filled"
              color="green"
              size="xl"
              radius="xl"
              loading={sellerMutation.isPending}
              onClick={() => sellerMutation.mutate()}
              leftSection={<RiLock2Fill size={28} />}
              styles={loginButtonStyles(sellerColor)}
            >
              以游客卖家身份登录
            </Button>
          </Stack>

          {(sellerMutation.isError || buyerMutation.isError) && (
            <Text c="red" size="sm" ta="center" fw={600}>
              登录失败，请稍后重试。
            </Text>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
