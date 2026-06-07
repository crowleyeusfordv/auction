from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.api.ws.manager import manager
from app.models.auction import Auction
from app.models.notification import Notification


def user_room_key(user_id: str) -> str:
    return f"user:{user_id}"


def base_auction_payload(auction: Auction) -> dict[str, Any]:
    return {
        "auctionId": str(auction.id),
        "auctionName": auction.product_name,
        "imageUrl": auction.image_url or "",
    }


def build_outbid_payload(
    auction: Auction,
    *,
    new_amount: float,
    your_position: int,
) -> dict[str, Any]:
    return {
        **base_auction_payload(auction),
        "newAmount": new_amount,
        "yourPosition": your_position,
    }


def build_auction_won_payload(
    auction: Auction,
    *,
    final_amount: float,
    order_id: str,
) -> dict[str, Any]:
    return {
        **base_auction_payload(auction),
        "finalAmount": final_amount,
        "orderId": order_id,
    }


def build_auction_lost_payload(
    auction: Auction,
    *,
    final_amount: float,
) -> dict[str, Any]:
    return {
        **base_auction_payload(auction),
        "finalAmount": final_amount,
    }


def unread_notifications(db: Session, user_id: str) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == UUID(user_id),
            Notification.is_read.is_(False),
        )
        .order_by(Notification.created_at.asc(), Notification.id.asc())
        .all()
    )


async def deliver_pending_notifications(
    db: Session,
    websocket: WebSocket,
    user_id: str,
) -> int:
    notifications = unread_notifications(db, user_id)
    if not notifications:
        return 0

    payload = [
        {
            "type": notification.type,
            "payload": notification.payload or {},
        }
        for notification in notifications
    ]
    await websocket.send_json({"type": "pending_notifications", "payload": payload})

    for notification in notifications:
        notification.is_read = True

    db.commit()
    return len(notifications)


async def send_or_persist_notification(
    db: Session,
    *,
    user_id: str,
    auction_id: str,
    notification_type: str,
    payload: dict[str, Any],
) -> bool:
    message = {"type": notification_type, "payload": payload}
    delivered = await manager.send_to_user(user_room_key(user_id), user_id, message)
    if delivered:
        return True

    try:
        from sqlalchemy.exc import IntegrityError
        with db.begin_nested():
            db.add(
                Notification(
                    user_id=UUID(user_id),
                    auction_id=UUID(auction_id),
                    type=notification_type,
                    payload=payload,
                    is_read=False,
                )
            )
            db.flush()
        db.commit()
    except IntegrityError:
        pass
    
    return False
