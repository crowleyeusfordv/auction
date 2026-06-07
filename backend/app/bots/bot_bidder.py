import asyncio
import logging
import random
import time

from app.core.redis_client import get_redis
from app.core.lua_scripts import execute_place_bid
from app.api.ws.auction_state import now_ms

logger = logging.getLogger(__name__)

BOT_BROADCAST_CONCURRENCY = 25
_broadcast_semaphore = asyncio.Semaphore(BOT_BROADCAST_CONCURRENCY)


async def bot_swarm_loop(
    auction_id: str,
    bot_ids: list[str],
    increment_value: float,
    trigger_seconds: int | None,
    seconds_extended: int | None,
    buy_out_price: float | None,
    batch_size: int,
    batch_delay: float,
) -> None:
    """
    Loop de bid unificado (Swarm) para todos os bots de um leilão.
    Gerencia N bots numa única task.
    Adiciona viewers gradualmente para simular a entrada orgânica.
    """
    intervals = {}
    next_bid = {}
    now = time.time()
    
    for bot_id in bot_ids:
        interval = random.uniform(5, 120)
        intervals[bot_id] = interval
        # Distribui os primeiros lances aleatoriamente
        next_bid[bot_id] = now + random.uniform(0, interval)

    redis = get_redis()
    bots_added_as_viewers = 0
    total_bots = len(bot_ids)
    last_batch_time = 0.0

    try:
        while True:
            now = time.time()

            # 1. Adiciona viewers gradativamente (simulando a chegada dos bots)
            if bots_added_as_viewers < total_bots and (now - last_batch_time >= batch_delay or bots_added_as_viewers == 0):
                to_add = min(batch_size, total_bots - bots_added_as_viewers)
                from app.api.ws.manager import manager
                manager.add_bot_viewers(auction_id, to_add)
                bots_added_as_viewers += to_add
                last_batch_time = now
                
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

            # 2. Checa se leilão ainda ativo no Redis
            active = await redis.get(f"auction:{auction_id}:active")
            if active is None or (
                isinstance(active, bytes) and active != b"1"
            ) or (
                isinstance(active, str) and active != "1"
            ):
                break

            # 3. Filtra apenas os bots que já "entraram" na sala
            active_bots = bot_ids[:bots_added_as_viewers]
            
            # 4. Encontra todos que o next_bid expirou
            due_bots = [b for b in active_bots if next_bid[b] <= now]
            
            buyout_hit = False
            for b in due_bots:
                res = await execute_place_bid(
                    auction_id,
                    b,
                    increment_value,
                    now_ms=now_ms(),
                    trigger_seconds=trigger_seconds,
                    seconds_extended=seconds_extended,
                    buy_out_price=buy_out_price,
                    requested_amount=None,
                )

                if isinstance(res, str):
                    if res in {"ERR_INACTIVE", "ERR_ENDED"}:
                        buyout_hit = True
                        break
                    # Atualiza o tempo mesmo se falhou (ex: outbid instantâneo)
                    next_bid[b] = time.time() + intervals[b]
                    continue

                (
                    new_amount,
                    raw_ranking,
                    ends_at_ms,
                    was_extended,
                    buyout_reached,
                    _leader_user_id,
                    _previous_leader_id,
                ) = res

                asyncio.create_task(
                    _broadcast_bot_bid_limited(
                        auction_id,
                        b,
                        new_amount,
                        raw_ranking,
                        was_extended,
                        ends_at_ms,
                        buyout_reached,
                        _previous_leader_id,
                    )
                )

                next_bid[b] = time.time() + intervals[b]

                if buyout_reached:
                    buyout_hit = True
                    break

            if buyout_hit:
                break
                
            await asyncio.sleep(0.5)

    except asyncio.CancelledError:
        pass
    except Exception:
        logger.exception("Bot swarm error on auction %s", auction_id)


async def _broadcast_bot_bid_limited(*args) -> None:
    async with _broadcast_semaphore:
        await _broadcast_bot_bid(*args)


async def _broadcast_bot_bid(
    auction_id: str,
    bot_user_id: str,
    new_amount: float,
    raw_ranking: list,
    was_extended: bool,
    ends_at_ms: int,
    buyout_reached: bool,
    previous_leader_id: str | None,
) -> None:
    """Propaga novo bid do bot fantasma para os viewers."""
    try:
        from app.api.ws.manager import manager
        from app.api.ws.auction_state import build_new_bid_payloads, now_ms as _now_ms, get_user_position
        from app.db.session import SessionLocal
        from app.api.ws.user_notifications import send_or_persist_notification, build_outbid_payload
        from app.models.auction import Auction
        from uuid import UUID

        redis = get_redis()
        with SessionLocal() as db:
            payloads = await build_new_bid_payloads(
                redis, db, auction_id, new_amount, raw_ranking
            )
            
            # Se o líder mudou, envia notificação de outbid
            if previous_leader_id and previous_leader_id != bot_user_id:
                previous_position = await get_user_position(
                    redis,
                    auction_id,
                    previous_leader_id,
                )
                if previous_position is not None:
                    auction = db.get(Auction, UUID(auction_id))
                    if auction:
                        await send_or_persist_notification(
                            db,
                            user_id=previous_leader_id,
                            auction_id=auction_id,
                            notification_type="outbid",
                            payload=build_outbid_payload(
                                auction,
                                new_amount=new_amount,
                                your_position=previous_position,
                            ),
                        )

        await manager.send_personalized("new_bid", payloads, auction_id)

        if was_extended:
            remaining = max(0, (ends_at_ms - _now_ms() + 999) // 1000)
            await manager.broadcast(
                "timer_extended",
                {"new_seconds_remaining": remaining},
                auction_id,
            )

        # -----------------------------------------------------
        # Salva os bids dos Ghost Bots no DB para contar em times_bidded
        from app.api.ws.bid_persist import persist_bid
        asyncio.create_task(persist_bid(auction_id, bot_user_id, new_amount))
        # -----------------------------------------------------

        if buyout_reached:
            from app.api.ws.lifecycle import finalize_auction
            await finalize_auction(auction_id)

    except Exception:
        logger.debug("Bot broadcast error on auction %s", auction_id)
