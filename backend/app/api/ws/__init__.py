import json
import asyncio
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.ws.manager import manager
from app.api.ws.bid_persist import persist_bid
from app.api.ws.auction_state import (
    build_new_bid_payloads,
    build_room_state,
    get_seconds_remaining,
    initialize_auction_state,
    now_ms,
)
from app.api.ws.lifecycle import finalize_auction
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

    if auction.status != AuctionStatus.ON_GOING.value:
        await websocket.close(code=4003)
        return

    redis = get_redis()
    await initialize_auction_state(redis, auction)

    if await get_seconds_remaining(redis, auction_id) <= 0:
        await finalize_auction(auction_id)
        await websocket.close(code=4003)
        return

    # Accept connection and add to manager
    await manager.connect(websocket, auction_id, user_id, user.name)

    # Send initial snapshot
    try:
        room_state = await build_room_state(redis, db, auction, user_id)
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
                    res = await execute_place_bid(
                        auction_id,
                        user_id,
                        float(auction.increment_value),
                        now_ms=now_ms(),
                        trigger_seconds=auction.trigger_seconds,
                        seconds_extended=auction.seconds_extended,
                        buy_out_price=float(auction.buy_out_price) if auction.buy_out_price is not None else None,
                    )
                    
                    if isinstance(res, str):
                        # Handle errors
                        if res in {"ERR_INACTIVE", "ERR_ENDED"}:
                            if res == "ERR_ENDED":
                                await finalize_auction(auction_id)
                            await websocket.send_json({
                                "type": "error",
                                "payload": {"code": res, "message": "Auction is not active."},
                            })
                        else:
                            await websocket.send_json({
                                "type": "error",
                                "payload": {"code": res, "message": "Could not place bid."},
                            })
                    else:
                        (
                            new_amount,
                            raw_ranking,
                            ends_at_ms,
                            was_extended,
                            buyout_reached,
                            _leader_user_id,
                        ) = res

                        payloads = await build_new_bid_payloads(
                            redis,
                            db,
                            auction_id,
                            new_amount,
                            raw_ranking,
                        )
                        await manager.send_personalized("new_bid", payloads, auction_id)

                        if was_extended:
                            remaining = max(0, (ends_at_ms - now_ms() + 999) // 1000)
                            await manager.broadcast(
                                "timer_extended",
                                {"new_seconds_remaining": remaining},
                                auction_id,
                            )

                        # Dispatch async background task for DB persistence
                        asyncio.create_task(persist_bid(auction_id, user_id, new_amount))

                        if buyout_reached:
                            await finalize_auction(auction_id)
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
