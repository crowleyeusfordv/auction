import json
from typing import Tuple, List, Dict, Any, Union
from app.core.redis_client import get_redis

# Lua Script:
# KEYS[1] = auction_id
# KEYS[2] = user_id
# ARGV[1] = increment_value
# Returns: [new_amount, [user_id_1, score_1, user_id_2, score_2, ...]] or an error string
PLACE_BID_SCRIPT = """
local auction_id = KEYS[1]
local user_id = KEYS[2]
local increment_value = tonumber(ARGV[1])

-- 1. Check Rate Limit
local rl_key = "auction:" .. auction_id .. ":ratelimit:" .. user_id
local is_limited = redis.call('SET', rl_key, '1', 'EX', 1, 'NX')
if not is_limited then
    return "ERR_RATE_LIMITED"
end

-- 2. Check if auction is active
local active = redis.call('GET', "auction:" .. auction_id .. ":active")
if active == "0" then
    return "ERR_INACTIVE"
end

-- 3. Calculate new bid
local current_bid = tonumber(redis.call('GET', "auction:" .. auction_id .. ":current_bid") or "0")
local new_amount = current_bid + increment_value

-- 4. Update current bid
redis.call('SET', "auction:" .. auction_id .. ":current_bid", tostring(new_amount))

-- 5. Update ZADD ranking
redis.call('ZADD', "auction:" .. auction_id .. ":ranking", new_amount, user_id)

-- 6. Fetch top 50 for the broadcast (to avoid massive payloads if many users)
local ranking = redis.call('ZREVRANGE', "auction:" .. auction_id .. ":ranking", 0, 49, 'WITHSCORES')

return {tostring(new_amount), ranking}
"""

async def execute_place_bid(auction_id: str, user_id: str, increment_value: float) -> Union[str, Tuple[float, List[Any]]]:
    """
    Executes the atomic Lua script to place a bid.
    Returns either an error string ('ERR_RATE_LIMITED', 'ERR_INACTIVE')
    or a tuple: (new_amount, raw_ranking_list)
    """
    redis = get_redis()
    
    # We must ensure the script is registered or just use EVAL
    result = await redis.eval(
        PLACE_BID_SCRIPT,
        2,  # number of keys
        auction_id,
        user_id,
        str(increment_value)
    )
    
    if isinstance(result, str):
        return result.decode('utf-8') if isinstance(result, bytes) else result
    if isinstance(result, bytes):
        return result.decode('utf-8')
        
    # Result should be [new_amount, [user_id_1, score_1, ...]]
    if isinstance(result, list) and len(result) == 2:
        new_amt_str = result[0].decode('utf-8') if isinstance(result[0], bytes) else result[0]
        raw_ranking = result[1]
        
        # Decode raw ranking bytes to strings
        decoded_ranking = []
        for item in raw_ranking:
            decoded_ranking.append(item.decode('utf-8') if isinstance(item, bytes) else item)
            
        return float(new_amt_str), decoded_ranking
        
    return "ERR_UNKNOWN"
