## 1. Redis Infrastructure & Lua Script

- [x] 1.1 Create `app/core/lua_scripts.py` (or similar) to define the Lua script for atomic bid placement.
- [x] 1.2 The Lua script must: check auction status, check Rate Limit (using `SET EX NX` with a 1-second expiration per `user_id`), compute `current_bid + increment_value`, update the `current_bid`, and add the `user_id` to the `ZADD` ranking with the new score.
- [x] 1.3 Add a Python helper function in `redis_client.py` or a new `bid_service.py` to execute this Lua script and return the `new_amount` and raw ranking data.

## 2. WebSocket Bid Handler

- [x] 2.1 Update `app/api/ws/__init__.py` to parse incoming messages and handle `{"type": "place_bid"}`.
- [x] 2.2 On `place_bid`, invoke the Redis Lua script helper.
- [x] 2.3 If the Lua script rejects the bid due to rate limiting, do not broadcast the standard new bid (return an error message if appropriate).
- [x] 2.4 If the auction is inactive, ignore/reject the bid.
- [x] 2.5 **Crucial**: To construct the `ranking` with user names, modify the connect flow to cache the `user_id -> name` mapping (either in memory via `ConnectionManager` or in Redis) so we don't query the DB on every bid.

## 3. Broadcast Payload Construction

- [x] 3.1 Update `app/api/ws/manager.py` (or a dedicated builder) to construct the `new_bid` payload.
- [x] 3.2 Ensure the payload includes `new_amount` and `ranking` (formatted as an array of objects `{name, amount}`).
- [x] 3.3 Iterate over all connected sockets for the `auction_id`. For each socket, check if their `user_id` is in the `ranking`.
- [x] 3.4 If the user is in the ranking, compute `your_position` via `ZREVRANK` (or from the fetched ranking list) and include it in their specific payload.
- [x] 3.5 Broadcast the personalized JSON to each client.

## 4. Asynchronous Database Persistence

- [x] 4.1 Create a background task function `persist_bid(auction_id, user_id, amount)` in a service file.
- [x] 4.2 In `app/api/ws/__init__.py` (or manager), after a successful Redis bid, use `asyncio.create_task(persist_bid(...))` to dispatch the DB write.
- [x] 4.3 In `persist_bid()`, attempt to insert the `Bid` record into Postgres.
- [x] 4.4 Catch any database exceptions (e.g., connection errors). If an error occurs, use Redis `RPUSH` to add the bid payload to a `failed_bids_queue` List.
- [x] 4.5 (Optional but recommended) Add a simple background loop in `lifespan` to periodically drain `failed_bids_queue` and retry DB insertion.
