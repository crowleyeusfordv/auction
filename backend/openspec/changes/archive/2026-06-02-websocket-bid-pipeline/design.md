## Context

The live room WebSocket connection is currently established and handles heartbeats and initial room snapshots. Users now need to place bids in real-time. Since multiple users might bid simultaneously, race conditions are a major concern.

## Goals / Non-Goals

**Goals:**
- Provide a low-latency path for users to place bids via WebSocket.
- Guarantee atomicity of the `current_bid` update to prevent race conditions.
- Broadcast the updated `new_bid` state to all connected clients immediately.
- Persist the bid to PostgreSQL asynchronously to not block the WebSocket fast-path.

**Non-Goals:**
- Implementing complex auction extensions (e.g., auto-extend timer) in this specific change (I will add this feature later. dont worry now)

## Decisions

**1. Redis Sorted Set for Atomic Updates & Ranking**
- *Rationale*: PostgreSQL row-level locks are too slow for real-time WebSocket fan-out, and JSON strings in Redis are slow to parse and sort. Redis Sorted Sets (`ZADD`) natively handle uniqueness per user and sort by score (bid amount).
- *Implementation*: Client sends only `{"type": "place_bid"}`. Use a Redis Lua script to atomically check if the auction is active, apply Rate Limit (max 1 bid/sec via `SET EX NX`), compute `current_bid + increment_value`, increment `current_bid`, and add the user to the `ZADD` ranking. If successful, return the new bid and `ZREVRANGE` ranking.

**2. Asynchronous Persistence with Redis Queue Retry**
- *Rationale*: We don't want the user to wait for a PostgreSQL disk write before seeing their bid succeed.
- *Implementation*: After Redis accepts the bid, dispatch an `asyncio.create_task()` to write to the `bids` table.

**3. Broadcast using ConnectionManager**
- *Rationale*: We already have a fast, in-memory `ConnectionManager`. 
- *Implementation*: We construct the `new_bid` payload and use `ZREVRANK` to get `your_position` for the bidder, then call `manager.broadcast()`.

## Risks / Trade-offs

- **Risk**: Redis goes down, causing bids to be lost before reaching PostgreSQL.
  - *Mitigation*: Redis persistence (AOF/RDB). The short window is acceptable for this system.
- **Risk**: Desynchronization between Redis and Postgres (DB insert fails).
  - *Mitigation*: The background task logs the error and pushes the bid payload to a Redis List (`failed_bids_queue`). A separate worker or scheduled task can safely retry inserting these into Postgres without losing data.
