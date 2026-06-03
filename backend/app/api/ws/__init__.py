import json
import asyncio
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.ws.manager import manager
from app.api.ws.bid_persist import persist_bid
from app.core.redis_client import get_redis
from app.core.lua_scripts import execute_place_bid
from app.models.user import User
from app.models.auction import Auction
from app.schemas.auction import AuctionStatus

ws_router = APIRouter()

@ws_router.websocket("/ws/auctions/{auction_id}")
async def auction_websocket(
    websocket: WebSocket,
    auction_id: str,
    user_id: str = None,
    db: Session = Depends(get_db)
):
    if not user_id or not auction_id:
        await websocket.close(code=4000)
        return

    # Validate auction ID format
    try:
        auction_uuid = UUID(auction_id)
    except ValueError:
        await websocket.close(code=4000)
        return

    # Validate user ID format
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        await websocket.close(code=4000)
        return

    # DB Validation
    user = db.get(User, user_uuid)
    if not user:
        await websocket.close(code=4004)
        return

    auction = db.get(Auction, auction_uuid)
    if not auction:
        await websocket.close(code=4000)
        return

    if auction.status == AuctionStatus.COMPLETED.value:
        await websocket.close(code=4003)
        return

    redis = get_redis()
    
    current_bid = await redis.get(f"auction:{auction_id}:current_bid")
    if current_bid is None:
        current_bid = float(auction.starting_bid)
        await redis.set(f"auction:{auction_id}:current_bid", str(current_bid))
        # Initialize active flag for Lua script
        await redis.set(f"auction:{auction_id}:active", "1")
    else:
        current_bid = float(current_bid)

    room_state = {
        "current_bid": current_bid,
        "increment_value": float(auction.increment_value),
        "seconds_remaining": auction.base_duration,
        "ranking": [] 
    }

    # Accept connection and add to manager
    await manager.connect(websocket, auction_id, user_id, user.name)
    
    # Send initial snapshot
    try:
        await websocket.send_json({"type": "room_state", "payload": room_state})
    except Exception:
        manager.disconnect(websocket, auction_id, user_id)
        return

    # Connection loop
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "heartbeat":
                    manager.update_heartbeat(websocket, auction_id, user_id)
                elif msg.get("type") == "place_bid":
                    increment_value = auction.increment_value
                    res = await execute_place_bid(auction_id, user_id, float(increment_value))
                    
                    if isinstance(res, str):
                        # Handle errors
                        if res == "ERR_RATE_LIMITED":
                            await websocket.send_json({"type": "error", "message": "Rate limited. Please wait 1 second."})
                        elif res == "ERR_INACTIVE":
                            await websocket.send_json({"type": "error", "message": "Auction is not active."})
                    else:
                        new_amount, raw_ranking = res
                        await manager.broadcast_new_bid(auction_id, new_amount, raw_ranking)
                        # Dispatch async background task for DB persistence
                        asyncio.create_task(persist_bid(auction_id, user_id, new_amount))
                else:
                    await websocket.close(code=1003)
                    manager.disconnect(websocket, auction_id, user_id)
                    break
            except json.JSONDecodeError:
                await websocket.close(code=1003)
                manager.disconnect(websocket, auction_id, user_id)
                break
    except WebSocketDisconnect:
        manager.disconnect(websocket, auction_id, user_id)
    except Exception:
        manager.disconnect(websocket, auction_id, user_id)
