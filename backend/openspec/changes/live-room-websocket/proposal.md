## Why

The live auction room requires real-time bidirectional communication. This solves the need to instantly distribute auction state (bids, time remaining, leader, viewers) to all connected clients.

## What Changes

- WebSocket endpoint creation at `/ws/auctions/{auction_id}?user_id={...}`.
- Connection state management and heartbeat validation (disconnect after 60s inactivity).
- Initial snapshot push (`room_state`) to clients upon successful connection reading from Redis.

## Capabilities

### New Capabilities
- `live-room-connection`: Core WebSocket connection lifecycle, heartbeat validation, and state initialization payload.

### Modified Capabilities

## Impact

- **Backend API**: New WebSocket routes in `app/api/ws/`.
- **Infrastructure**: Redis state reads integration for the room snapshot.
