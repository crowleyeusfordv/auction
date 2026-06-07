import asyncio
import logging
import secrets
import uuid

from app.core.redis_client import get_redis
from app.db.session import SessionLocal
from app.models.auction import Auction
from app.schemas.auction import AuctionStatus

logger = logging.getLogger(__name__)

# ─── Constants ───────────────────────────────────────────────────────────────
TOTAL_BOTS       = 1000   # Virtual bots per auction (no sockets — pure Redis)
BATCH_SIZE       = 50    # Bots revealed as "viewers" per batch
BATCH_DELAY      = 2.0   # Seconds between viewer batches
MONITOR_INTERVAL = 10.0  # Seconds between monitor ticks

# ─── State ───────────────────────────────────────────────────────────────────
# auction_id → asyncio.Task (the single swarm task)
_swarm_tasks: dict[str, asyncio.Task] = {}

# auction_id → list[str] (in-memory bot UUIDs)
_bot_ids: dict[str, list[str]] = {}

# auction_ids currently managed
_spawned_auctions: set[str] = set()


# ─── Redis helpers ────────────────────────────────────────────────────────────
def _bots_key(auction_id: str) -> str:
    return f"bots:{auction_id}"


async def _save_bot_ids_to_redis(redis, auction_id: str, bot_ids: list[str]) -> None:
    if bot_ids:
        await redis.sadd(_bots_key(auction_id), *bot_ids)


async def _get_bot_ids_from_redis(redis, auction_id: str) -> set[str]:
    raw = await redis.smembers(_bots_key(auction_id))
    return {v.decode("utf-8") if isinstance(v, bytes) else v for v in raw}


async def _delete_bots_redis_key(redis, auction_id: str) -> None:
    await redis.delete(_bots_key(auction_id))
    await redis.delete(f"auction:{auction_id}:bot_names")


# ─── Spawn ────────────────────────────────────────────────────────────────────
async def spawn_bots_for_auction(auction_id: str, auction: Auction) -> None:
    """
    Spawns a single ghost-swarm task for the auction.
    Bots are pure UUIDs in memory — no DB users, no sockets, no FDs.
    Bids go directly through execute_place_bid (same Lua path as real users).
    """
    if auction_id in _spawned_auctions:
        return

    _spawned_auctions.add(auction_id)

    # Generate bot IDs + names in memory — no DB round-trip
    # 4 bytes = 8 hex chars → 4 billion combinations, collision-safe even with 1000 bots
    bot_ids   = [str(uuid.uuid4()) for _ in range(TOTAL_BOTS)]
    bot_names = {bid: f"Bot_{secrets.token_hex(4).upper()}" for bid in bot_ids}
    _bot_ids[auction_id] = bot_ids

    # Persist IDs and names to Redis so load_user_names resolves them
    redis = get_redis()
    await _save_bot_ids_to_redis(redis, auction_id, bot_ids)
    if bot_names:
        await redis.hset(f"auction:{auction_id}:bot_names", mapping=bot_names)

    # Insert ghost users into Postgres to satisfy bids table foreign key.
    # ON CONFLICT DO NOTHING handles duplicate ids/names across restarts gracefully.
    with SessionLocal() as db:
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        from app.models.user import User
        try:
            stmt = pg_insert(User).values([
                {"id": uuid.UUID(bid), "name": bname, "role": "bot"}
                for bid, bname in bot_names.items()
            ]).on_conflict_do_nothing()
            db.execute(stmt)
            db.commit()
            logger.info("Ghost users upserted for auction %s", auction_id)
        except Exception as e:
            db.rollback()
            logger.error("Failed to insert ghost users to DB: %s", e)

    logger.info("Spawning ghost swarm (%d bots) for auction %s", TOTAL_BOTS, auction_id)

    from app.bots.bot_bidder import bot_swarm_loop

    task = asyncio.create_task(
        bot_swarm_loop(
            auction_id=auction_id,
            bot_ids=bot_ids,
            increment_value=float(auction.increment_value),
            trigger_seconds=auction.trigger_seconds,
            seconds_extended=auction.seconds_extended,
            buy_out_price=float(auction.buy_out_price) if auction.buy_out_price else None,
            batch_size=BATCH_SIZE,
            batch_delay=BATCH_DELAY,
        ),
        name=f"swarm:{auction_id[:8]}",
    )
    _swarm_tasks[auction_id] = task
    logger.info("Ghost swarm started for auction %s", auction_id)


# ─── Cleanup ──────────────────────────────────────────────────────────────────
async def cleanup_bots_for_auction(auction_id: str) -> None:
    """
    Cancels the swarm task, removes virtual viewers, cleans Redis.
    If a bot was the winner, deletes the phantom order from DB.
    """
    if auction_id not in _spawned_auctions:
        return

    _spawned_auctions.discard(auction_id)

    # 1. Cancel swarm task
    task = _swarm_tasks.pop(auction_id, None)
    if task and not task.done():
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    redis = get_redis()
    bot_ids = await _get_bot_ids_from_redis(redis, auction_id)
    _bot_ids.pop(auction_id, None)

    if not bot_ids:
        await _delete_bots_redis_key(redis, auction_id)
        return

    logger.info("Cleaning up %d ghost bots for auction %s", len(bot_ids), auction_id)

    # 2. Remove virtual viewers from manager
    from app.api.ws.manager import manager
    current_bots = manager.bot_viewer_counts.get(auction_id, 0)
    if current_bots:
        manager.remove_bot_viewers(auction_id, current_bots)

    # 3. If a bot won, delete the phantom order from DB
    try:
        from uuid import UUID
        from sqlalchemy.exc import SQLAlchemyError

        winner_data = await redis.hgetall(f"auction:{auction_id}:leader")
        winner_id_raw = winner_data.get(b"user_id") or winner_data.get("user_id")
        if winner_id_raw:
            winner_id_str = winner_id_raw.decode("utf-8") if isinstance(winner_id_raw, bytes) else winner_id_raw
            if winner_id_str in bot_ids:
                from app.models.order import Order
                with SessionLocal() as db:
                    try:
                        deleted = db.query(Order).filter(
                            Order.auction_id == UUID(auction_id)
                        ).delete(synchronize_session=False)
                        if deleted:
                            logger.info("Deleted phantom order for bot winner on auction %s", auction_id)
                        db.commit()
                    except SQLAlchemyError:
                        db.rollback()
    except Exception:
        pass

    # 4. Clean Redis
    await _delete_bots_redis_key(redis, auction_id)

    # 5. Broadcast updated viewer count
    try:
        asyncio.create_task(
            manager.broadcast(
                "viewer_count",
                {"count": manager.get_viewer_count(auction_id)},
                auction_id,
            )
        )
    except Exception:
        pass

    logger.info("Ghost bot cleanup complete for auction %s", auction_id)


# ─── Monitor ──────────────────────────────────────────────────────────────────
async def start_bot_monitor() -> None:
    """
    Polls DB every MONITOR_INTERVAL seconds.
    - ON_GOING auctions without a swarm → spawn
    - Auctions no longer ON_GOING but with a swarm → cleanup
    """
    logger.info("Bot monitor started (ghost swarm mode)")

    while True:
        await asyncio.sleep(MONITOR_INTERVAL)
        try:
            with SessionLocal() as db:
                ongoing_auctions = (
                    db.query(Auction)
                    .filter(Auction.status == AuctionStatus.ON_GOING.value)
                    .all()
                )
                ongoing_ids = {str(a.id) for a in ongoing_auctions}

                for auction in ongoing_auctions:
                    aid = str(auction.id)
                    if aid not in _spawned_auctions:
                        asyncio.create_task(spawn_bots_for_auction(aid, auction))

            stale = _spawned_auctions - ongoing_ids
            for aid in stale:
                asyncio.create_task(cleanup_bots_for_auction(aid))

        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Bot monitor error")
