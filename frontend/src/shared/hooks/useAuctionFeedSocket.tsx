import { useEffect } from "react";
import useWebSocketPkg from "react-use-websocket";
import { WEBSOCKET_BASE_URL } from "@/shared/config/urls";

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
    shouldConnect && WEBSOCKET_BASE_URL ? `${WEBSOCKET_BASE_URL}/ws/auction-feed` : null,
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
