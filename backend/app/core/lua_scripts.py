from typing import Any, List, Tuple, Union

from app.core.redis_client import get_redis

# Lua Script:
# KEYS[1] = auction_id
# KEYS[2] = user_id
# ARGV[1] = increment_value
# ARGV[2] = now_ms
# ARGV[3] = trigger_seconds
# ARGV[4] = seconds_extended
# ARGV[5] = buy_out_price (0 means disabled)
# Returns:
# [
#   new_amount,
#   ranking,
#   ends_at_ms,
#   extended_flag,
#   buyout_reached_flag,
#   leader_user_id
# ] or an error string
PLACE_BID_SCRIPT = """
local auction_id = KEYS[1]
local user_id = KEYS[2]
local increment_value = tonumber(ARGV[1])
local now_ms = tonumber(ARGV[2])
local trigger_seconds = tonumber(ARGV[3]) or 0
local seconds_extended = tonumber(ARGV[4]) or 0
local buy_out_price = tonumber(ARGV[5]) or 0

local active_key = "auction:" .. auction_id .. ":active"
local current_bid_key = "auction:" .. auction_id .. ":current_bid"
local ends_at_key = "auction:" .. auction_id .. ":ends_at"
local ranking_key = "auction:" .. auction_id .. ":ranking"
local leader_key = "auction:" .. auction_id .. ":leader"

-- 1. Check if auction is active.
local active = redis.call('GET', active_key)
if active ~= "1" then
    return "ERR_INACTIVE"
end

local ends_at_ms = tonumber(redis.call('GET', ends_at_key) or "0")
if ends_at_ms <= 0 then
    return "ERR_NOT_INITIALIZED"
end

if now_ms >= ends_at_ms then
    redis.call('SET', active_key, "0")
    redis.call('SREM', "auctions:active", auction_id)
    return "ERR_ENDED"
end

-- 2. Calculate new bid. The backend never trusts client-provided values.
local current_bid_raw = redis.call('GET', current_bid_key)
if not current_bid_raw then
    return "ERR_NOT_INITIALIZED"
end

local current_bid = tonumber(current_bid_raw)
local new_amount = current_bid + increment_value
local buyout_reached = 0

if buy_out_price > 0 and new_amount >= buy_out_price then
    new_amount = buy_out_price
    buyout_reached = 1
end

-- 3. Update current bid, ranking, and leader.
redis.call('SET', current_bid_key, tostring(new_amount))
redis.call('ZADD', ranking_key, new_amount, user_id)
redis.call('HSET', leader_key, "user_id", user_id, "amount", tostring(new_amount))

-- 4. Extend timer when a bid lands in the configured final window.
local extended = 0
local remaining_ms = ends_at_ms - now_ms
if buyout_reached == 0 and trigger_seconds > 0 and seconds_extended > 0 then
    if remaining_ms <= (trigger_seconds * 1000) then
        ends_at_ms = ends_at_ms + (seconds_extended * 1000)
        redis.call('SET', ends_at_key, tostring(ends_at_ms))
        extended = 1
    end
end

if buyout_reached == 1 then
    redis.call('SET', active_key, "0")
    redis.call('SREM', "auctions:active", auction_id)
end

-- 5. Fetch top 50 for broadcast snapshots.
local ranking = redis.call('ZREVRANGE', ranking_key, 0, 49, 'WITHSCORES')

return {tostring(new_amount), ranking, tostring(ends_at_ms), tostring(extended), tostring(buyout_reached), user_id}
"""


async def execute_place_bid(
    auction_id: str,
    user_id: str,
    increment_value: float,
    *,
    now_ms: int,
    trigger_seconds: int | None,
    seconds_extended: int | None,
    buy_out_price: float | None,
) -> Union[str, Tuple[float, List[Any], int, bool, bool, str]]:
    """
    Executes the atomic Lua script to place a bid.
    Returns either an error string or:
    (new_amount, raw_ranking_list, ends_at_ms, extended, buyout_reached, leader_user_id)
    """
    redis = get_redis()

    result = await redis.eval(
        PLACE_BID_SCRIPT,
        2,  # number of keys
        auction_id,
        user_id,
        str(increment_value),
        str(now_ms),
        str(trigger_seconds or 0),
        str(seconds_extended or 0),
        str(buy_out_price or 0),
    )

    if isinstance(result, str):
        return result
    if isinstance(result, bytes):
        return result.decode("utf-8")

    if isinstance(result, list) and len(result) == 6:
        new_amt_str = result[0].decode("utf-8") if isinstance(result[0], bytes) else result[0]
        raw_ranking = result[1]

        decoded_ranking = []
        for item in raw_ranking:
            decoded_ranking.append(item.decode("utf-8") if isinstance(item, bytes) else item)

        ends_at_raw = result[2].decode("utf-8") if isinstance(result[2], bytes) else result[2]
        extended_raw = result[3].decode("utf-8") if isinstance(result[3], bytes) else result[3]
        buyout_raw = result[4].decode("utf-8") if isinstance(result[4], bytes) else result[4]
        leader_raw = result[5].decode("utf-8") if isinstance(result[5], bytes) else result[5]

        return (
            float(new_amt_str),
            decoded_ranking,
            int(float(ends_at_raw)),
            str(extended_raw) == "1",
            str(buyout_raw) == "1",
            str(leader_raw),
        )

    return "ERR_UNKNOWN"
