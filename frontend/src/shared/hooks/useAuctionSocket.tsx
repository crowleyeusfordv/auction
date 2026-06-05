import { useEffect } from "react";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useLiveRoomStore } from "@/features/live-room/store/liveRoomStore";
import useWebSocketPkg from "react-use-websocket";

const WS_URL = import.meta.env.VITE_WEBSOCKET_API_BASE_URL;

const HEARTBEAT_INTERVAL_MS = 30_000;

// Handle Vite CJS default export interop
const useWebSocket = (typeof useWebSocketPkg === "function" ? useWebSocketPkg : (useWebSocketPkg as any).default) as typeof useWebSocketPkg;

export function useAuctionSocket(auctionId: string) {
    const userId = useAuthStore((s) => s.user?.id);

    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket<any>(
        userId ? `${WS_URL}/ws/auctions/${auctionId}` : null,
        {
            queryParams: userId ? { user_id: userId } : {},
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

    const store = useLiveRoomStore();

    useEffect(() => {
        store.initRoom(auctionId);
    }, [auctionId]);

    useEffect(() => {
        if (!lastJsonMessage) return;

        const { type, ...payload } = lastJsonMessage;

        switch (type) {
            case "error":
                console.error("WS Error:", payload);
                const actualPayload = payload.payload || payload;
                alert(`Erro [${actualPayload.code || "UNKNOWN"}]: ${actualPayload.message || "Não foi possível dar o lance"}`);
                break;
            case "room_state":
                store.setRoomState(auctionId, {
                    currentBid: {
                        bidderId: payload.leader?.userId || payload.leader?.user_id || null,
                        bidderName: payload.leader?.name || null,
                        amount: payload.currentBid,
                        timestamp: null,
                    },
                    incrementValue: payload.incrementValue,
                    timer: {
                        remainingMs: payload.remainingMs,
                        serverTime: payload.serverTime,
                    },
                    ranking: payload.ranking,
                    viewerCount: payload.viewerCount,
                });
                break;
            case "new_bid":
                store.setNewBid(auctionId, {
                    bidderId: payload.leader?.userId || payload.leader?.user_id,
                    bidderName: payload.leader?.name,
                    amount: payload.newAmount,
                    timestamp: new Date().toISOString(),
                });
                if (payload.ranking) {
                    store.setRankingUpdate(auctionId, payload.ranking, payload.yourPosition);
                }
                break;
            case "ranking_update":
                store.setRankingUpdate(auctionId, payload.top3, payload.userPosition);
                break;
            case "timer_sync":
                store.setTimerSync(auctionId, payload.remainingMs, payload.serverTime);
                break;
            case "viewer_count":
                store.setViewerCount(auctionId, payload.count);
                break;
            case "time_extended":
                store.setTimerSync(auctionId, payload.newRemainingMs, null);
                break;
            case "auction_ended":
                store.setAuctionEnded(auctionId, payload.winnerId, payload.winnerName, payload.finalAmount);
                break;
            case "auction_cancelled":
                store.setAuctionCancelled(auctionId, payload.reason);
                break;
        }
    }, [lastJsonMessage, auctionId]);

    return { sendJsonMessage, readyState };
}
