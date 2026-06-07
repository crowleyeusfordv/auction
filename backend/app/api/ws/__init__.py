import json
import asyncio
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal

from app.api.deps import get_db
from app.api.ws.manager import manager
from app.api.ws.bid_persist import persist_bid
from app.api.ws.auction_state import (
    build_new_bid_payloads,
    build_room_state,
    get_user_position,
    get_seconds_remaining,
    initialize_auction_state,
    now_ms,
)
from app.api.ws.lifecycle import finalize_auction
from app.api.ws.user_notifications import (
    build_outbid_payload,
    deliver_pending_notifications,
    send_or_persist_notification,
    user_room_key,
)
from app.core.redis_client import get_redis
from app.core.lua_scripts import execute_place_bid
from app.models.user import User
from app.models.auction import Auction
from app.schemas.auction import AuctionStatus

ws_router = APIRouter()

@ws_router.websocket("/ws/user/{user_id}")
@ws_router.websocket("/ws/users/{user_id}")
async def user_notifications_websocket(
    websocket: WebSocket,
    user_id: str,
):
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        await websocket.close(code=4000)
        return

    with SessionLocal() as db:
        user = db.get(User, user_uuid)
        if not user:
            await websocket.close(code=4004)
            return

    normalized_user_id = str(user_uuid)
    room_key = user_room_key(normalized_user_id)
    await manager.connect(websocket, room_key, normalized_user_id, user.name)

    try:
        with SessionLocal() as db:
            await deliver_pending_notifications(db, websocket, normalized_user_id)

        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await websocket.close(code=1003)
                break

            if msg.get("type") == "heartbeat":
                manager.update_heartbeat(websocket, room_key, normalized_user_id)
            else:
                await websocket.close(code=1003)
                break
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(websocket, room_key, normalized_user_id)


@ws_router.websocket("/ws/auctions/{auction_id}")
async def auction_websocket(
    websocket: WebSocket,
    auction_id: str,
    user_id: str = None
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
    auction_id = str(auction_uuid)
    user_id = str(user_uuid)

    # DB Validation
    with SessionLocal() as db:
        user = db.get(User, user_uuid)
        if not user:
            await websocket.close(code=4004)
            return

        auction = db.get(Auction, auction_uuid)
        if not auction:
            await websocket.close(code=4000)
            return
            
        # We need the values for later
        auction_increment_value = float(auction.increment_value)
        auction_trigger_seconds = auction.trigger_seconds
        auction_seconds_extended = auction.seconds_extended
        auction_buy_out_price = float(auction.buy_out_price) if auction.buy_out_price is not None else None
        user_name = user.name

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
    await manager.connect(websocket, auction_id, user_id, user_name)

    # Send initial snapshot
    try:
        with SessionLocal() as db:
            # Re-fetch auction just for this state build
            auction = db.get(Auction, auction_uuid)
            room_state = await build_room_state(redis, db, auction, user_id)
            camel_state = manager._to_camel_case(room_state)
            await websocket.send_json({"type": "room_state", **camel_state})
    except Exception as e:
        print(f"WebSocket Init Error: {e}")
        import traceback
        traceback.print_exc()
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
                        auction_increment_value,
                        now_ms=now_ms(),
                        trigger_seconds=auction_trigger_seconds,
                        seconds_extended=auction_seconds_extended,
                        buy_out_price=auction_buy_out_price,
                        requested_amount=msg.get("amount"),
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
                            previous_leader_id,
                        ) = res

                        with SessionLocal() as db:
                            payloads = await build_new_bid_payloads(
                                redis,
                                db,
                                auction_id,
                                new_amount,
                                raw_ranking,
                            )
                            await manager.send_personalized("new_bid", payloads, auction_id)
    
                            if previous_leader_id and previous_leader_id != user_id:
                                previous_position = await get_user_position(
                                    redis,
                                    auction_id,
                                    previous_leader_id,
                                )
                                if previous_position is not None:
                                    auction_obj = db.get(Auction, auction_uuid)
                                    await send_or_persist_notification(
                                        db,
                                        user_id=previous_leader_id,
                                        auction_id=auction_id,
                                        notification_type="outbid",
                                        payload=build_outbid_payload(
                                            auction_obj,
                                            new_amount=new_amount,
                                            your_position=previous_position,
                                        ),
                                    )

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
