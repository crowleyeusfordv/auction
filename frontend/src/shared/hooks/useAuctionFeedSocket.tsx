import { useEffect } from "react";
import useWebSocketPkg from "react-use-websocket";

const WS_URL = import.meta.env.VITE_WEBSOCKET_API_BASE_URL;

const HEARTBEAT_INTERVAL_MS = 30_000;

const useWebSocket = (typeof useWebSocketPkg === "function" ? useWebSocketPkg : (useWebSocketPkg as any).default) as typeof useWebSocketPkg;

export interface AuctionFeedMessage {
  type: "auction_feed_updated";
  action: string;
  auctionId: string;
  sellerId: string;
  status: string;
}

export function useAuctionFeedSocket(
  onAuctionFeedUpdated: (message: AuctionFeedMessage) => void,
  shouldConnect: boolean = true,
) {
  const { lastJsonMessage } = useWebSocket<AuctionFeedMessage>(
    shouldConnect && WS_URL ? `${WS_URL}/ws/auction-feed` : null,
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
    if (!lastJsonMessage || lastJsonMessage.type !== "auction_feed_updated") return;

    onAuctionFeedUpdated(lastJsonMessage);
  }, [lastJsonMessage, onAuctionFeedUpdated]);
}
