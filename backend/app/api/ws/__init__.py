import json
import asyncio
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.ws.manager import manager
from app.core.redis_client import get_redis
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

    # Fetch snapshot from Redis
    # Assuming snapshot is stored at 'auction:{auction_id}:state'
    redis = get_redis()
    raw_state = await redis.get(f"auction:{auction_id}:state")
    room_state = json.loads(raw_state) if raw_state else {}

    # Accept connection and add to manager
    await manager.connect(websocket, auction_id, user_id)
    
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
