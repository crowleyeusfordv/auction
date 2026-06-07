import asyncio
import logging

from app.api.ws.auction_state import (
    active_auction_ids,
    build_auction_ended_payload,
    complete_auction_in_db,
    get_auction_participant_ids,
    get_order_for_auction,
    get_remaining_ms,
    initialize_auction_state,
    lock_auction_in_redis,
)
from app.api.ws.manager import manager
from app.api.ws.user_notifications import (
    build_auction_lost_payload,
    build_auction_won_payload,
    send_or_persist_notification,
)
from app.core.redis_client import get_redis
from app.db.session import SessionLocal
from app.models.auction import Auction
from app.schemas.auction import AuctionStatus


logger = logging.getLogger(__name__)


async def dispatch_final_user_notifications(
    db,
    auction,
    *,
    participant_ids: list[str],
    winner_id: str | None,
    final_amount: float | None,
) -> None:
    if final_amount is None:
        return

    if winner_id:
        order = get_order_for_auction(db, auction)
        if order is None:
            logger.warning("No order found for completed auction %s", auction.id)
        else:
            await send_or_persist_notification(
                db,
                user_id=winner_id,
                auction_id=str(auction.id),
                notification_type="auction_won",
                payload=build_auction_won_payload(
                    auction,
                    final_amount=final_amount,
                    order_id=str(order.id),
                ),
            )

    for participant_id in participant_ids:
        if participant_id == winner_id:
            continue

        await send_or_persist_notification(
            db,
            user_id=participant_id,
            auction_id=str(auction.id),
            notification_type="auction_lost",
            payload=build_auction_lost_payload(
                auction,
                final_amount=final_amount,
            ),
        )


async def finalize_auction(auction_id: str) -> bool:
    redis = get_redis()
    winner_id, final_amount, locked = await lock_auction_in_redis(redis, auction_id)
    if not locked:
        return False

    participant_ids = await get_auction_participant_ids(redis, auction_id)

    with SessionLocal() as db:
        auction = complete_auction_in_db(db, auction_id, winner_id, final_amount)
        if auction is None:
            logger.warning("Tried to finalize missing auction %s", auction_id)
            return False

        await dispatch_final_user_notifications(
            db,
            auction,
            participant_ids=participant_ids,
            winner_id=winner_id,
            final_amount=final_amount,
        )
        payload = build_auction_ended_payload(db, winner_id, final_amount)

    await manager.broadcast("auction_ended", payload, auction_id)
    await manager.disconnect_all(auction_id)

    # Cleanup bots imediatamente ao finalizar leilão
    try:
        from app.bots.bot_manager import cleanup_bots_for_auction
        asyncio.create_task(cleanup_bots_for_auction(auction_id))
    except Exception:
        pass

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


async def start_scheduler_monitor() -> None:
    from app.api.ws.auction_state import utc_now
    while True:
        await asyncio.sleep(10)
        try:
            redis = get_redis()
            with SessionLocal() as db:
                auctions = (
                    db.query(Auction)
                    .filter(Auction.status == AuctionStatus.NOT_STARTED.value)
                    .filter(Auction.scheduled_time_to_start <= utc_now())
                    .all()
                )
                for auction in auctions:
                    auction.status = AuctionStatus.ON_GOING.value
                    auction.started_at = utc_now()
                    db.commit()
                    db.refresh(auction)
                    await initialize_auction_state(redis, auction)
                    logger.info("Scheduled auction %s started automatically.", auction.id)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Scheduler monitor failed")
