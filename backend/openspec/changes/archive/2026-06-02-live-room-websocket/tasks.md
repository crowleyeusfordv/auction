## 1. Connection Manager Setup

- [x] 1.1 Modify existing `ConnectionManager` class in `app/api/ws/manager.py` to support double mapping (`auction_id` -> `user_id` -> `List[WebSocket]`) and heartbeat tracking.
- [x] 1.2 Implement `connect`, `disconnect`, and `disconnect_all` methods in `ConnectionManager`.
- [x] 1.3 Implement `broadcast` method to send messages to all active sockets of a given `auction_id` enforcing the `{"type": ..., "payload": ...}` structure.

## 2. WebSocket Endpoint Validation

- [x] 2.1 Add `/ws/auctions/{auction_id}` WebSocket route in `app/api/ws/__init__.py` accepting `user_id` query param.
- [x] 2.2 Add DB session dependency to validate `user_id` exists in DB. Reject with 4004 if not found.
- [x] 2.3 Validate `auction_id` exists and is not finished. Reject with 4003 if finished, 4000 if missing/invalid.
- [x] 2.4 Enforce max 5 concurrent sockets per `user_id` (disconnect oldest if limit exceeded).

## 3. Snapshot & Connection Loop

- [x] 3.1 Fetch `room_state` snapshot from Redis for the requested `auction_id`.
- [x] 3.2 Add client to `ConnectionManager` *after* fetching the snapshot from Redis.
- [x] 3.3 Push the `room_state` snapshot to the client.
- [x] 3.4 Implement receive loop: handle `{"type": "heartbeat"}` by silently updating timestamp. Disconnect with 1003 on invalid JSON.

## 4. Background Tasks & Finalization

- [x] 4.1 Implement async background task to prune connections without a heartbeat for > 60 seconds.
- [x] 4.2 Ensure robust `finally` block in WebSocket endpoint to guarantee `manager.disconnect()` is always called.
- [x] 4.3 Implement Auction Finish logic: broadcast final `room_state`, then close all sockets for that `auction_id` with code 1000.
