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
            case "room_state":
                store.setRoomState(auctionId, {
                    currentBid: payload.current_bid,
                    timer: payload.timer,
                    ranking: payload.ranking,
                    viewerCount: payload.viewers,
                });
                break;
            case "new_bid":
                store.setNewBid(auctionId, {
                    bidderId: payload.bidder_id,
                    bidderName: payload.bidder_name,
                    amount: payload.amount,
                    timestamp: payload.timestamp,
                });
                break;
            case "ranking_update":
                store.setRankingUpdate(auctionId, payload.top3, payload.user_position);
                break;
            case "timer_sync":
                store.setTimerSync(auctionId, payload.remaining_ms, payload.server_time);
                break;
            case "viewer_count":
                store.setViewerCount(auctionId, payload.count);
                break;
            case "time_extended":
                store.setTimerSync(auctionId, payload.new_remaining_ms, null);
                break;
            case "auction_ended":
                store.setAuctionEnded(auctionId, payload.winner_id, payload.winner_name, payload.final_amount);
                break;
            case "auction_cancelled":
                store.setAuctionCancelled(auctionId, payload.reason);
                break;
        }
    }, [lastJsonMessage, auctionId]);

    return { sendJsonMessage, readyState };
}
