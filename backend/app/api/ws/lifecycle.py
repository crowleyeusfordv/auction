import asyncio
import logging

from app.api.ws.auction_state import (
    active_auction_ids,
    build_auction_ended_payload,
    complete_auction_in_db,
    get_remaining_ms,
    initialize_auction_state,
    lock_auction_in_redis,
)
from app.api.ws.manager import manager
from app.core.redis_client import get_redis
from app.db.session import SessionLocal
from app.models.auction import Auction
from app.schemas.auction import AuctionStatus


logger = logging.getLogger(__name__)


async def finalize_auction(auction_id: str) -> bool:
    redis = get_redis()
    winner_id, final_amount, locked = await lock_auction_in_redis(redis, auction_id)
    if not locked:
        return False

    with SessionLocal() as db:
        auction = complete_auction_in_db(db, auction_id, winner_id, final_amount)
        if auction is None:
            logger.warning("Tried to finalize missing auction %s", auction_id)
            return False

        payload = build_auction_ended_payload(db, winner_id, final_amount)

    await manager.broadcast("auction_ended", payload, auction_id)
    await manager.disconnect_all(auction_id)
    return True


async def initialize_active_auctions_from_db() -> None:
    redis = get_redis()
    with SessionLocal() as db:
        auctions = (
            db.query(Auction)
            .filter(Auction.status == AuctionStatus.ON_GOING.value)
            .all()
        )
        for auction in auctions:
            await initialize_auction_state(redis, auction)
            if await get_remaining_ms(redis, str(auction.id)) <= 0:
                await finalize_auction(str(auction.id))


async def start_timer_monitor() -> None:
    await initialize_active_auctions_from_db()

    while True:
        await asyncio.sleep(1)
        try:
            redis = get_redis()
            for auction_id in await active_auction_ids(redis):
                if await get_remaining_ms(redis, auction_id) <= 0:
                    await finalize_auction(auction_id)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Auction timer monitor failed")
