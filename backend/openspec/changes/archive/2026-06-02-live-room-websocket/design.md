## Context

The platform requires a real-time WebSocket connection to broadcast live auction state (bids, viewers, remaining time) to users. The backend uses FastAPI, and we need an endpoint `/ws/auctions/{auction_id}?user_id={...}`. The state is stored in Redis.

## Goals / Non-Goals

**Goals:**
- Manage WebSocket connections grouped by `auction_id`.
- Track clients using `user_id`.
- Send an initial `room_state` snapshot from Redis upon connection.
- Disconnect clients failing to send a heartbeat within 60 seconds.

**Non-Goals:**
- Multi-instance WebSocket scaling (e.g. Redis Pub/Sub for cross-instance broadcast) is deferred. We focus on local memory connection management and Redis for snapshot data.

## Decisions

- **FastAPI WebSockets**: Use standard `WebSocket` and `APIRouter`. Endpoint will depend on DB session to validate `user_id` and check if `auction_id` is still active.
- **ConnectionManager**: A singleton or module-level class managing active connections. It maps `auction_id` to a dictionary tracking multiple WebSockets per `user_id` (e.g., `Dict[str, Dict[str, List[WebSocket]]]`), allowing users to connect from multiple devices.
- **Heartbeat Mechanism**: Expect client to send `{ "type": "heartbeat" }`. Server will track `last_heartbeat` per connection and run an async background task to prune inactive connections (no heartbeat > 60s).
- **Snapshot from Redis**: On `websocket.accept()`, fetch auction state from Redis and immediately push the initial `room_state` payload.

## Risks / Trade-offs

- **Memory Leak Risk** → If connections are not properly removed on disconnect, we leak memory. Mitigation: Robust `try...finally` block to ensure `manager.disconnect()` is called on all WebSocket exit paths.
- **Single Point of Failure** → Local memory connection state means clients tied to one pod. Acceptable trade-off for current scale.
