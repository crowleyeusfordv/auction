import { useEffect, useRef } from "react";
import { useUserNotificationsSocket } from "@/shared/hooks/useUserNotificationsSocket";
import { matchPath, useNavigate } from "react-router";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "sonner";
import { Box, Button, Flex, Paper, Text, ThemeIcon } from "@mantine/core";
import { LuCircleAlert, LuCircleX, LuTrophy } from "react-icons/lu";
import { WonNotificationModal } from "./WonNotificationModal";
import { LostNotificationModal } from "./LostNotificationModal";
import { CancelledNotificationModal } from "./CancelledNotificationModal";
import type { UserNotification } from "@/shared/types/notifications";
import { useNotificationStore } from "@/shared/store/useNotificationStore";
import outbidMascot from "@/assets/mascots/outbid-crying.webp";

const formatCurrency = (value: number) => `¥${Math.max(0, value).toLocaleString("en-US")}`;

const playNotificationSound = (type: UserNotification["type"]) => {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const gain = context.createGain();
    gain.connect(context.destination);

    const now = context.currentTime;
    const frequencies =
        type === "outbid" ? [523.25, 392] :
            type === "auction_won" || type === "auction_cancelled_won" ? [659.25, 783.99, 1046.5] :
                [392, 329.63];

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + frequencies.length * 0.095 + 0.1);

    frequencies.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.095);
        oscillator.connect(gain);
        oscillator.start(now + index * 0.095);
        oscillator.stop(now + index * 0.095 + 0.075);
    });

    window.setTimeout(() => {
        void context.close();
    }, frequencies.length * 105 + 180);
};

export function NotificationProvider() {
    const { activeNotification, dismiss, pathname } = useUserNotificationsSocket();
    const navigate = useNavigate();
    const lastToastId = useRef<string | number | null>(null);
    const lastSoundNotificationRef = useRef<UserNotification | null>(null);

    // Auto-dismiss modals when navigating away from the live room
    useEffect(() => {
        if (!activeNotification) return;

        const match = matchPath(ROUTES.AUCTIONS.LIVE_ROOM, pathname);
        const isLiveRoomForThisAuction = match?.params.auction_id === activeNotification.payload?.auctionId;

        const isModalScenario =
            isLiveRoomForThisAuction &&
            (
                activeNotification.type === "auction_won" ||
                activeNotification.type === "auction_lost" ||
                activeNotification.type === "auction_cancelled_won" ||
                activeNotification.type === "auction_cancelled_lost"
            );

        // If we are showing a modal but we navigated away from the live room, dismiss it
        if (!isLiveRoomForThisAuction && isModalScenario) {
            dismiss();
        }
    }, [pathname, activeNotification, dismiss]);

    // Sync modal state with global store
    useEffect(() => {
        const match = matchPath(ROUTES.AUCTIONS.LIVE_ROOM, pathname);
        const isLiveRoomForThisAuction = match?.params.auction_id === activeNotification?.payload?.auctionId;
        const isModalScenario =
            isLiveRoomForThisAuction &&
            (
                activeNotification?.type === "auction_won" ||
                activeNotification?.type === "auction_lost" ||
                activeNotification?.type === "auction_cancelled_won" ||
                activeNotification?.type === "auction_cancelled_lost"
            );

        useNotificationStore.getState().setResultModalOpen(!!isModalScenario);
    }, [activeNotification, pathname]);

    useEffect(() => {
        if (!activeNotification || activeNotification.type !== "auction_lost" || !activeNotification.payload.cancelled) return;

        const match = matchPath(ROUTES.AUCTIONS.LIVE_ROOM, pathname);
        const isLiveRoomForThisAuction = match?.params.auction_id === activeNotification.payload.auctionId;
        if (isLiveRoomForThisAuction) {
            dismiss();
        }
    }, [activeNotification, pathname, dismiss]);

    useEffect(() => {
        const activeOutbidAuctionId = activeNotification?.type === "outbid"
            ? activeNotification.payload.auctionId
            : null;

        useNotificationStore.getState().setActiveOutbidAuctionId(activeOutbidAuctionId);

        return () => {
            useNotificationStore.getState().setActiveOutbidAuctionId(null);
        };
    }, [activeNotification]);

    // Play a short sound once per active notification. Browsers may suppress it
    // until the user has interacted with the page.
    useEffect(() => {
        if (!activeNotification || lastSoundNotificationRef.current === activeNotification) return;

        lastSoundNotificationRef.current = activeNotification;
        playNotificationSound(activeNotification.type);
    }, [activeNotification]);

    // Handle toast rendering
    useEffect(() => {
        if (!activeNotification) {
            if (lastToastId.current !== null) {
                toast.dismiss(lastToastId.current);
                lastToastId.current = null;
            }
            return;
        }

        const match = matchPath(ROUTES.AUCTIONS.LIVE_ROOM, pathname);
        const isLiveRoomForThisAuction = match?.params.auction_id === activeNotification.payload?.auctionId;

        // Modals are handled in the return block
        if (
            isLiveRoomForThisAuction &&
            (
                activeNotification.type === "auction_won" ||
                activeNotification.type === "auction_lost" ||
                activeNotification.type === "auction_cancelled_won" ||
                activeNotification.type === "auction_cancelled_lost"
            )
        ) {
            return;
        }

        // Render Toast
        const id = toast.custom((t) => (
            <ToastContent
                notification={activeNotification}
                isLiveRoom={isLiveRoomForThisAuction}
                onDismiss={() => {
                    toast.dismiss(t);
                    dismiss();
                }}
                navigate={navigate}
            />
        ), {
            duration: Infinity, // The socket hook controls the 3s duration and dismissal
            position: "bottom-center",
        });

        lastToastId.current = id;

        return () => {
            toast.dismiss(id);
        };
    }, [activeNotification, pathname, dismiss, navigate]);

    // Modals rendering
    if (!activeNotification) return null;

    const match = matchPath(ROUTES.AUCTIONS.LIVE_ROOM, pathname);
    const isLiveRoomForThisAuction = match?.params.auction_id === activeNotification.payload?.auctionId;

    if (!isLiveRoomForThisAuction) return null;

    if (activeNotification.type === "auction_won") {
        return (
            <WonNotificationModal
                isOpen={true}
                onClose={dismiss}
                auctionId={activeNotification.payload.auctionId}
                auctionName={activeNotification.payload.auctionName}
                imageUrl={activeNotification.payload.imageUrl}
                finalAmount={activeNotification.payload.finalAmount ?? 0}
            />
        );
    }

    if (activeNotification.type === "auction_lost" && activeNotification.payload.cancelled) {
        return (
            <CancelledNotificationModal
                isOpen={true}
                onClose={dismiss}
                auctionName={activeNotification.payload.auctionName}
                imageUrl={activeNotification.payload.imageUrl}
            />
        );
    }

    if (activeNotification.type === "auction_lost") {
        return (
            <LostNotificationModal
                isOpen={true}
                onClose={dismiss}
                auctionName={activeNotification.payload.auctionName}
                imageUrl={activeNotification.payload.imageUrl}
                finalAmount={activeNotification.payload.finalAmount ?? 0}
            />
        );
    }

    if (activeNotification.type === "auction_cancelled_won" || activeNotification.type === "auction_cancelled_lost") {
        return (
            <CancelledNotificationModal
                isOpen={true}
                onClose={dismiss}
                auctionName={activeNotification.payload.auctionName}
                imageUrl={activeNotification.payload.imageUrl}
            />
        );
    }

    return null;
}

// Internal Toast Component
function ToastContent({
    notification,
    isLiveRoom,
    onDismiss,
    navigate,
}: {
    notification: UserNotification;
    isLiveRoom: boolean;
    onDismiss: () => void;
    navigate: ReturnType<typeof useNavigate>;
}) {
    const requestBidModal = useNotificationStore(s => s.requestBidModal);

    const handleAction = () => {
        onDismiss();

        if (notification.type === "outbid") {
            requestBidModal(notification.payload.auctionId);
            if (!isLiveRoom) {
                navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(notification.payload.auctionId));
            }
        } else if (notification.type === "auction_won") {
            navigate(ROUTES.AUCTIONS.PAYMENT_DYNAMIC_PATH(notification.payload.auctionId));
        } else if (notification.type === "auction_lost") {
            navigate(ROUTES.AUCTIONS.ROOT);
        } else if (notification.type === "auction_cancelled_won" || notification.type === "auction_cancelled_lost") {
            navigate(ROUTES.AUCTIONS.ROOT);
        }
    };

    let message = "";
    let buttonLabel = "";
    let title = "";
    let accentColor = "var(--mantine-color-red-6)";
    let buttonColor = "red";
    let iconColor = "red";
    let surfaceColor = "rgba(250, 82, 82, 0.10)";
    let Icon = LuCircleAlert;

    if (notification.type === "outbid") {
        title = "你被超越了";
        message = `当前最高价 ${formatCurrency(notification.payload.newAmount)}，你现在排名 #${notification.payload.yourPosition}`;
        buttonLabel = isLiveRoom ? "继续出价" : "去出价";
    } else if (notification.type === "auction_won") {
        title = "竞拍成功";
        message = `你赢得了 ${notification.payload.auctionName}，成交价 ${formatCurrency(notification.payload.finalAmount)}`;
        buttonLabel = "去支付";
        accentColor = "var(--mantine-color-green-6)";
        buttonColor = "green";
        iconColor = "green";
        surfaceColor = "rgba(64, 192, 87, 0.12)";
        Icon = LuTrophy;
    } else if (notification.type === "auction_lost" && notification.payload.cancelled) {
        title = "卖家取消了拍卖";
        message = `${notification.payload.auctionName} 已作废，没有赢家，也不会生成订单`;
        buttonLabel = "确认";
        accentColor = "var(--mantine-color-gray-6)";
        buttonColor = "gray";
        iconColor = "gray";
        surfaceColor = "rgba(134, 142, 150, 0.12)";
        Icon = LuCircleX;
    } else if (notification.type === "auction_lost") {
        title = "竞拍结束";
        message = `你未拍中 ${notification.payload.auctionName}，最终价 ${formatCurrency(notification.payload.finalAmount ?? 0)}`;
        buttonLabel = "看其他拍卖";
        accentColor = "var(--mantine-color-gray-6)";
        buttonColor = "gray";
        iconColor = "gray";
        surfaceColor = "rgba(134, 142, 150, 0.12)";
        Icon = LuCircleX;
    } else if (notification.type === "auction_cancelled_won" || notification.type === "auction_cancelled_lost") {
        title = "卖家取消了拍卖";
        message = `${notification.payload.auctionName} 已作废，没有赢家，也不会生成订单`;
        buttonLabel = "确认";
        accentColor = "var(--mantine-color-gray-6)";
        buttonColor = "gray";
        iconColor = "gray";
        surfaceColor = "rgba(134, 142, 150, 0.12)";
        Icon = LuCircleX;
    }

    return (
        <Paper
            className="notification-toast-pop"
            p="md"
            shadow="lg"
            radius="md"
            bg="white"
            w="calc(100vw - 32px)"
            maw={380}
            withBorder
            style={{
                borderLeft: `4px solid ${accentColor}`,
                background: `linear-gradient(135deg, ${surfaceColor} 0%, white 46%)`,
                overflow: "hidden",
            }}
        >
            <Flex gap="sm" align="flex-start">
                {notification.type === "outbid" ? (
                    <Box
                        component="img"
                        src={outbidMascot}
                        alt=""
                        w={62}
                        h={62}
                        mt={-8}
                        ml={-4}
                        style={{ objectFit: "contain", flexShrink: 0 }}
                    />
                ) : (
                    <ThemeIcon size={44} radius="xl" variant="light" color={iconColor} mt={2}>
                        <Icon size={22} />
                    </ThemeIcon>
                )}

                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Flex direction="column" gap={8}>
                        <Text size="sm" fw={900} c="gray.9" lh={1.15}>
                            {title}
                        </Text>
                        <Text size="xs" fw={500} c="gray.7" lh={1.35}>
                            {message}
                        </Text>
                        <Button size="xs" onClick={handleAction} fullWidth color={buttonColor} radius="sm">
                            {buttonLabel}
                        </Button>
                    </Flex>
                </Box>
            </Flex>
        </Paper>
    );
}
