## Why

Enable real-time bidding in the live room. Users need to place bids and receive immediate feedback on rankings and leader changes without polling or refreshing the page.

## What Changes

- Add WebSocket message listener for `{"type": "place_bid"}`. `user_id` will be received as query param
- Calculate the new bid amount: `current_bid + increment_value`.
- Atomically increment the `current_bid` in Redis to prevent race conditions.
- Broadcast a `{"type": "new_bid", "payload": {...}}` message to all connected clients in the room.
- Calculate and include `your_position` for users who have placed at least one bid.
- Asynchronously persist the bid record to the PostgreSQL `bids` table.

## Capabilities

### New Capabilities
- `live-room-bidding`: Defines the real-time bid placement pipeline, Redis atomicity, and broadcast structure (`new_bid`).

### Modified Capabilities
- `live-room-connection`: Add support for the new `place_bid` incoming message type and `new_bid` outgoing message type.

## Impact

- `app/api/ws/manager.py`: Needs logic to broadcast new bid updates.
- `app/api/ws/__init__.py`: Handle the `place_bid` message type.
- **Redis**: New keys or Lua scripts for atomic increment of `current_bid`.
- **Database**: Async task to persist bids to the `bids` table.
