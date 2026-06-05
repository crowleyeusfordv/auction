import useWebSocketPkg from "react-use-websocket";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router";
import type { UserNotification, UserWsMessage } from "@/shared/types/notifications";

const WS_URL = import.meta.env.VITE_WEBSOCKET_API_BASE_URL;

const HEARTBEAT_INTERVAL_MS = 30_000;
const NOTIFICATION_DISPLAY_MS = 3_000;

// Handle Vite CJS default export interop
const useWebSocket = (typeof useWebSocketPkg === "function" ? useWebSocketPkg : (useWebSocketPkg as any).default) as typeof useWebSocketPkg;

export function useUserNotificationsSocket() {
    const userId = useAuthStore((s) => s.user?.id);
    const location = useLocation();

    const [activeNotification, setActiveNotification] = useState<UserNotification | null>(null);
    const [notificationQueue, setNotificationQueue] = useState<UserNotification[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { lastJsonMessage } = useWebSocket<UserWsMessage>(
        userId ? `${WS_URL}/ws/users/${userId}` : null,
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

    const enqueue = useCallback((notifications: UserNotification[]) => {
        setNotificationQueue((prev) => [...prev, ...notifications]);
    }, []);

    useEffect(() => {
        if (!lastJsonMessage) return;

        const msg = lastJsonMessage as UserWsMessage;

        if (msg.type === "pending_notifications") {
            enqueue(msg.payload);
        } else if (msg.type === "outbid" || msg.type === "auction_won" || msg.type === "auction_lost") {
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
        if (activeNotification.type === "auction_won" || activeNotification.type === "auction_lost") {
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
