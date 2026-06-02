import { useEffect, useRef } from "react";
import { useUserNotificationsSocket } from "@/shared/hooks/useUserNotificationsSocket";
import { matchPath, useNavigate } from "react-router";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "sonner";
import { Button, Flex, Paper, Text } from "@mantine/core";
import { WonNotificationModal } from "./WonNotificationModal";
import { LostNotificationModal } from "./LostNotificationModal";
import type { UserNotification } from "@/shared/types/notifications";

export function NotificationProvider() {
    const { activeNotification, dismiss, pathname } = useUserNotificationsSocket();
    const navigate = useNavigate();
    const lastToastId = useRef<string | number | null>(null);

    // Auto-dismiss modals when navigating away from the live room
    useEffect(() => {
        if (!activeNotification) return;

        const match = matchPath(ROUTES.AUCTIONS.LIVE_ROOM, pathname);
        const isLiveRoomForThisAuction = match?.params.auction_id === activeNotification.payload.auctionId;

        const isModalScenario =
            isLiveRoomForThisAuction &&
            (activeNotification.type === "auction_won" || activeNotification.type === "auction_lost");

        // If we are showing a modal but we navigated away from the live room, dismiss it
        if (!isLiveRoomForThisAuction && isModalScenario) {
            dismiss();
        }
    }, [pathname, activeNotification, dismiss]);

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
        const isLiveRoomForThisAuction = match?.params.auction_id === activeNotification.payload.auctionId;

        // Modals are handled in the return block
        if (isLiveRoomForThisAuction && (activeNotification.type === "auction_won" || activeNotification.type === "auction_lost")) {
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
            position: "top-center",
        });

        lastToastId.current = id;

        return () => {
            toast.dismiss(id);
        };
    }, [activeNotification, pathname, dismiss, navigate]);

    // Modals rendering
    if (!activeNotification) return null;

    const match = matchPath(ROUTES.AUCTIONS.LIVE_ROOM, pathname);
    const isLiveRoomForThisAuction = match?.params.auction_id === activeNotification.payload.auctionId;

    if (!isLiveRoomForThisAuction) return null;

    if (activeNotification.type === "auction_won") {
        return (
            <WonNotificationModal
                isOpen={true}
                onClose={dismiss}
                auctionId={activeNotification.payload.auctionId}
                auctionName={activeNotification.payload.auctionName}
                imageUrl={activeNotification.payload.imageUrl}
                finalAmount={activeNotification.payload.finalAmount}
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
                finalAmount={activeNotification.payload.finalAmount}
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
    const handleAction = () => {
        onDismiss();

        if (notification.type === "outbid") {
            if (!isLiveRoom) {
                navigate(ROUTES.AUCTIONS.LIVE_ROOM_DYNAMIC_PATH(notification.payload.auctionId));
            }
        } else if (notification.type === "auction_won") {
            navigate(ROUTES.AUCTIONS.PAYMENT_DYNAMIC_PATH(notification.payload.auctionId));
        } else if (notification.type === "auction_lost") {
            navigate(ROUTES.AUCTIONS.ROOT);
        }
    };

    let message = "";
    let buttonLabel = "";

    if (notification.type === "outbid") {
        message = "Unfortunately you were outbid. Make a new bid to win this auction!";
        buttonLabel = "MAKE NEW BID";
    } else if (notification.type === "auction_won") {
        message = `You won the auction: ${notification.payload.auctionName}!`;
        buttonLabel = "PAY";
    } else if (notification.type === "auction_lost") {
        message = `You lost the auction: ${notification.payload.auctionName}`;
        buttonLabel = "SEE SIMILAR AUCTIONS";
    }

    return (
        <Paper p="md" shadow="md" radius="md" bg="white" w="100%" maw={400}>
            <Flex direction="column" gap="sm">
                <Text size="sm" fw={500}>
                    {message}
                </Text>
                <Button size="xs" onClick={handleAction} fullWidth>
                    {buttonLabel}
                </Button>
            </Flex>
        </Paper>
    );
}
