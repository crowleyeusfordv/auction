import useWebSocketPkg from "react-use-websocket";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router";
import type { UserNotification, UserWsMessage } from "@/shared/types/notifications";
import { WEBSOCKET_BASE_URL } from "@/shared/config/urls";

const HEARTBEAT_INTERVAL_MS = 30_000;
const NOTIFICATION_DISPLAY_MS = 3_000;

// Handle Vite CJS default export interop
const useWebSocket = (typeof useWebSocketPkg === "function" ? useWebSocketPkg : (useWebSocketPkg as any).default) as typeof useWebSocketPkg;

export function useUserNotificationsSocket() {
    const location = useLocation();
    const isSellerRoute = location.pathname.startsWith("/seller");
    const userId = useAuthStore((s) => {
        if (isSellerRoute) return undefined;

        return s.buyerUser?.id ?? (s.user?.role === "buyer" ? s.user.id : undefined);
    });

    const [activeNotification, setActiveNotification] = useState<UserNotification | null>(null);
    const [notificationQueue, setNotificationQueue] = useState<UserNotification[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { lastJsonMessage } = useWebSocket<UserWsMessage>(
        userId && WEBSOCKET_BASE_URL ? `${WEBSOCKET_BASE_URL}/ws/users/${userId}` : null,
        {
            shouldReconnect: () => true,
            reconnectAttempts: Infinity,
            reconnectInterval: 3000,
            heartbeat: {
                message: () => JSON.stringify({ type: "heartbeat" }),
                interval: HEARTBEAT_INTERVAL_MS,
                timeout: 60_000,
            },
        },
    );

    useEffect(() => {
        if (!isSellerRoute) return;

        if (timerRef.current) clearTimeout(timerRef.current);
        setActiveNotification(null);
        setNotificationQueue([]);
    }, [isSellerRoute]);

    const enqueue = useCallback((notifications: UserNotification[]) => {
        setNotificationQueue((prev) => [...prev, ...notifications]);
    }, []);

    useEffect(() => {
        if (!lastJsonMessage) return;

        const msg = lastJsonMessage as UserWsMessage;

        if (msg.type === "pending_notifications") {
            enqueue(msg.payload);
        } else if (
            msg.type === "outbid" ||
            msg.type === "auction_won" ||
            msg.type === "auction_lost" ||
            msg.type === "auction_cancelled_won" ||
            msg.type === "auction_cancelled_lost"
        ) {
            enqueue([msg as UserNotification]);
        }
    }, [lastJsonMessage, enqueue]);

    useEffect(() => {
        if (activeNotification) return;

        if (notificationQueue.length > 0) {
            const [next, ...rest] = notificationQueue;
            setActiveNotification(next);
            setNotificationQueue(rest);
        }
    }, [activeNotification, notificationQueue]);

    useEffect(() => {
        if (!activeNotification) return;
        if (
            activeNotification.type === "auction_won" ||
            activeNotification.type === "auction_lost" ||
            activeNotification.type === "auction_cancelled_won" ||
            activeNotification.type === "auction_cancelled_lost"
        ) {
            return;
        }

        timerRef.current = setTimeout(() => {
            setActiveNotification(null);
        }, NOTIFICATION_DISPLAY_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [activeNotification]);

    const dismiss = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setActiveNotification(null);
    }, []);

    return {
        activeNotification,
        queueLength: notificationQueue.length,
        dismiss,
        pathname: location.pathname,
    };
}
