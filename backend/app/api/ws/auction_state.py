from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.api.ws.manager import manager
from app.models.bid import Bid
from app.models.auction import Auction
from app.models.order import Order
from app.models.user import User
from app.schemas.auction import AuctionStatus


ACTIVE_AUCTIONS_KEY = "auctions:active"
RANKING_LIMIT = 50


def now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_epoch_ms(value: datetime) -> int:
    if value.tzinfo is None or value.utcoffset() is None:
        value = value.replace(tzinfo=timezone.utc)
    return int(value.timestamp() * 1000)


def auction_duration_ms(auction: Auction) -> int:
    # The seller forms label baseDuration as minutes.
    return int(auction.base_duration or 0) * 60 * 1000


def auction_key(auction_id: str, suffix: str) -> str:
    return f"auction:{auction_id}:{suffix}"


def is_auction_active_in_db(auction: Auction) -> bool:
    return auction.status == AuctionStatus.ON_GOING.value


def calculate_initial_ends_at_ms(auction: Auction, current_ms: int) -> int:
    started_at_ms = to_epoch_ms(auction.started_at) if auction.started_at else current_ms
    return started_at_ms + auction_duration_ms(auction)


async def initialize_auction_state(redis, auction: Auction) -> None:
    auction_id = str(auction.id)

    if not is_auction_active_in_db(auction):
        await redis.set(auction_key(auction_id, "active"), "0")
        await redis.srem(ACTIVE_AUCTIONS_KEY, auction_id)
        return

    current_ms = now_ms()
    ends_at_key = auction_key(auction_id, "ends_at")
    current_bid_key = auction_key(auction_id, "current_bid")

    if await redis.get(current_bid_key) is None:
        await redis.set(current_bid_key, str(float(auction.starting_bid or 0)))

    if await redis.get(ends_at_key) is None:
        await redis.set(ends_at_key, str(calculate_initial_ends_at_ms(auction, current_ms)))

    ends_at = int(float(await redis.get(ends_at_key) or "0"))
    if ends_at > current_ms:
        await redis.set(auction_key(auction_id, "active"), "1")
        await redis.sadd(ACTIVE_AUCTIONS_KEY, auction_id)
    else:
        await redis.set(auction_key(auction_id, "active"), "0")
        await redis.srem(ACTIVE_AUCTIONS_KEY, auction_id)


async def active_auction_ids(redis) -> list[str]:
    values = await redis.smembers(ACTIVE_AUCTIONS_KEY)
    return [value.decode("utf-8") if isinstance(value, bytes) else str(value) for value in values]


async def get_seconds_remaining(redis, auction_id: str, current_ms: int | None = None) -> int:
    current_ms = current_ms if current_ms is not None else now_ms()
    ends_at = int(float(await redis.get(auction_key(auction_id, "ends_at")) or "0"))
    return max(0, (ends_at - current_ms + 999) // 1000)


async def get_remaining_ms(redis, auction_id: str, current_ms: int | None = None) -> int:
    current_ms = current_ms if current_ms is not None else now_ms()
    ends_at = int(float(await redis.get(auction_key(auction_id, "ends_at")) or "0"))
    return max(0, ends_at - current_ms)


def parse_ranking(raw_ranking: list[Any]) -> list[tuple[str, float]]:
    parsed: list[tuple[str, float]] = []
    for index in range(0, len(raw_ranking), 2):
        user_id_raw = raw_ranking[index]
        user_id = user_id_raw.decode("utf-8") if isinstance(user_id_raw, bytes) else str(user_id_raw)
        amount = float(raw_ranking[index + 1])
        parsed.append((user_id, amount))
    return parsed


async def load_user_names(db: Session, user_ids: list[str], auction_id: str | None = None) -> dict[str, str]:
    valid_ids: list[UUID] = []
    for user_id in user_ids:
        try:
            valid_ids.append(UUID(user_id))
        except ValueError:
            continue

    if not valid_ids:
        return {}

    users = db.query(User).filter(User.id.in_(valid_ids)).all()
    names = {str(user.id): user.name for user in users}
    
    # Se faltarem nomes e for provido auction_id, busca no Redis (ghost bots)
    missing_ids = [str(uid) for uid in valid_ids if str(uid) not in names]
    if missing_ids and auction_id:
        from app.core.redis_client import get_redis
        redis = get_redis()
        bot_names_key = f"auction:{auction_id}:bot_names"
        redis_names = await redis.hmget(bot_names_key, missing_ids)
        for i, bot_name in enumerate(redis_names):
            if bot_name:
                names[missing_ids[i]] = bot_name

    return names


async def format_ranking(db: Session, raw_ranking: list[Any], auction_id: str | None = None) -> list[dict[str, Any]]:
    parsed = parse_ranking(raw_ranking)
    names = await load_user_names(db, [user_id for user_id, _ in parsed], auction_id=auction_id)

    ranking = []
    for index, (user_id, amount) in enumerate(parsed, start=1):
        name = names.get(user_id, "Unknown")
        ranking.append(
            {
                "user_id": user_id,
                "name": name,
                "amount": amount,
                "position": index,
                # Frontend-friendly aliases. The task fields above remain present.
                "userId": user_id,
                "username": name,
                "bidAmount": amount,
            }
        )

    return ranking


async def get_top_ranking(redis, db: Session, auction_id: str) -> list[dict[str, Any]]:
    raw_ranking = await redis.zrevrange(
        auction_key(auction_id, "ranking"),
        0,
        RANKING_LIMIT - 1,
        withscores=True,
    )
    flattened: list[Any] = []
    for user_id, amount in raw_ranking:
        flattened.extend([user_id, amount])
    return await format_ranking(db, flattened, auction_id=auction_id)


async def get_auction_participant_ids(redis, auction_id: str) -> list[str]:
    user_ids = await redis.zrevrange(auction_key(auction_id, "ranking"), 0, -1)
    return [uid.decode("utf-8") if isinstance(uid, bytes) else str(uid) for uid in user_ids]


async def get_user_position_and_amount(redis, auction_id: str, user_id: str) -> tuple[int | None, float | None]:
    rank = await redis.zrevrank(auction_key(auction_id, "ranking"), user_id)
    if rank is None:
        return None, None
    score = await redis.zscore(auction_key(auction_id, "ranking"), user_id)
    return int(rank) + 1, float(score) if score is not None else None

async def get_user_position(redis, auction_id: str, user_id: str) -> int | None:
    pos, _ = await get_user_position_and_amount(redis, auction_id, user_id)
    return pos


async def get_leader(redis, db: Session, auction_id: str) -> dict[str, Any] | None:
    leader_data = await redis.hgetall(auction_key(auction_id, "leader"))
    leader_id = leader_data.get("user_id") if leader_data else None
    if not leader_id:
        top = await redis.zrevrange(auction_key(auction_id, "ranking"), 0, 0, withscores=True)
        if not top:
            return None
        leader_id_raw = top[0][0]
        leader_id = leader_id_raw.decode("utf-8") if isinstance(leader_id_raw, bytes) else str(leader_id_raw)

    names = await load_user_names(db, [str(leader_id)], auction_id=auction_id)
    return {"user_id": str(leader_id), "name": names.get(str(leader_id), "Unknown")}


async def build_room_state(redis, db: Session, auction: Auction, user_id: str) -> dict[str, Any]:
    auction_id = str(auction.id)
    current_ms = now_ms()
    current_bid = float(await redis.get(auction_key(auction_id, "current_bid")) or auction.starting_bid or 0)
    remaining_ms = await get_remaining_ms(redis, auction_id, current_ms)
    position, amount = await get_user_position_and_amount(redis, auction_id, user_id)

    payload = {
        "current_bid": current_bid,
        "increment_value": float(auction.increment_value),
        "seconds_remaining": max(0, (remaining_ms + 999) // 1000),
        "remaining_ms": remaining_ms,
        "server_time": datetime.fromtimestamp(current_ms / 1000, timezone.utc).isoformat(),
        "leader": await get_leader(redis, db, auction_id),
        "ranking": await get_top_ranking(redis, db, auction_id),
        "viewer_count": manager.get_viewer_count(auction_id),
    }

    if position is not None:
        payload["your_position"] = position
    if amount is not None:
        payload["your_amount"] = amount

    return payload


async def build_new_bid_payloads(
    redis,
    db: Session,
    auction_id: str,
    new_amount: float,
    raw_ranking: list[Any],
) -> dict[str, dict[str, Any]]:
    ranking = await format_ranking(db, raw_ranking, auction_id=auction_id)
    leader = await get_leader(redis, db, auction_id)
    users = manager.active_connections.get(auction_id, {})
    payloads: dict[str, dict[str, Any]] = {}

    for user_id in users:
        position, amount = await get_user_position_and_amount(redis, auction_id, user_id)
        payload = {
            "new_amount": new_amount,
            "leader": leader,
            "ranking": ranking,
        }
        if position is not None:
            payload["your_position"] = position
        if amount is not None:
            payload["your_amount"] = amount
        payloads[user_id] = payload

    return payloads


async def lock_auction_in_redis(redis, auction_id: str) -> tuple[str | None, float | None, bool]:
    finalize_lock_acquired = await redis.set(
        auction_key(auction_id, "finalized"),
        "1",
        nx=True,
        ex=60 * 60 * 24,
    )
    if not finalize_lock_acquired:
        return None, None, False

    active_key = auction_key(auction_id, "active")
    await redis.set(active_key, "0")
    await redis.srem(ACTIVE_AUCTIONS_KEY, auction_id)
    leader_data = await redis.hgetall(auction_key(auction_id, "leader"))
    winner_id_raw = leader_data.get(b"user_id") or leader_data.get("user_id") if leader_data else None
    winner_id = winner_id_raw.decode("utf-8") if isinstance(winner_id_raw, bytes) else str(winner_id_raw) if winner_id_raw else None
    final_amount = leader_data.get(b"amount") or leader_data.get("amount") if leader_data else None

    if final_amount is None:
        current_bid = await redis.get(auction_key(auction_id, "current_bid"))
        final_amount = current_bid

    return (
        str(winner_id) if winner_id else None,
        float(final_amount) if final_amount is not None else None,
        True,
    )


def create_order_if_needed(
    db: Session,
    auction: Auction,
    winner_id: str | None,
    final_amount: float | None,
) -> Order | None:
    if winner_id is None or final_amount is None:
        return None

    existing_order = db.query(Order).filter(Order.auction_id == auction.id).first()
    if existing_order is not None:
        return existing_order

    order = Order(
        auction_id=auction.id,
        buyer_id=UUID(winner_id),
        seller_id=auction.seller_id,
        final_price=Decimal(str(final_amount)),
        status="pending",
    )
    
    try:
        from sqlalchemy.exc import IntegrityError
        # Savepoint explicitly since we are catching DB error
        with db.begin_nested():
            db.add(order)
            db.flush()
        return order
    except IntegrityError:
        # Ghost bot (does not exist in DB), rollback implicitly handled by begin_nested()
        return None


def get_order_for_auction(db: Session, auction: Auction) -> Order | None:
    return db.query(Order).filter(Order.auction_id == auction.id).first()


def complete_auction_in_db(
    db: Session,
    auction_id: str,
    winner_id: str | None,
    final_amount: float | None,
) -> Auction | None:
    auction = db.get(Auction, UUID(auction_id))
    if auction is None:
        return None
    
    highest_bid = (
        db.query(Bid)
        .filter(Bid.auction_id == auction.id)
        .order_by(Bid.amount.desc(), Bid.created_at.desc())
        .first()
    )
    if highest_bid is not None:
        highest_amount = float(highest_bid.amount)
        if final_amount is None or highest_amount > final_amount:
            final_amount = highest_amount
            winner_id = str(highest_bid.buyer_id)

    if auction.status != AuctionStatus.COMPLETED.value:
        auction.status = AuctionStatus.COMPLETED.value
        auction.ended_at = utc_now()
        create_order_if_needed(db, auction, winner_id, final_amount)
        db.commit()
        db.refresh(auction)

    return auction


def build_auction_ended_payload(
    db: Session,
    winner_id: str | None,
    final_amount: float | None,
) -> dict[str, Any]:
    winner = None
    if winner_id:
        user = db.get(User, UUID(winner_id))
        winner = {
            "user_id": winner_id,
            "name": user.name if user else "Unknown",
        }

    return {
        "winner": winner,
        "final_amount": final_amount,
    }
