import json
import logging
import uuid
from decimal import Decimal
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.bid import Bid
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

async def persist_bid(auction_id: str, buyer_id: str, amount: float) -> None:
    """
    Asynchronously pushes the bid data to a Redis List for bulk insertion.
    This avoids blocking the database with individual inserts.
    """
    try:
        redis = get_redis()
        payload = json.dumps({
            "auction_id": auction_id,
            "buyer_id": buyer_id,
            "amount": amount
        })
        await redis.rpush("bids_persistence_queue", payload)
    except Exception as redis_error:
        logger.error(f"Failed to push bid to Redis persistence queue: {redis_error}")

async def drain_bids_queue() -> None:
    """
    Periodically drains the `bids_persistence_queue` and bulk inserts to Postgres.
    FK violations (ghost bot IDs) are discarded — not re-queued.
    """
    import asyncio
    while True:
        await asyncio.sleep(5)
        batch = []
        try:
            redis = get_redis()
            for _ in range(500):
                raw_payload = await redis.lpop("bids_persistence_queue")
                if not raw_payload:
                    break
                payload_str = raw_payload.decode("utf-8") if isinstance(raw_payload, bytes) else raw_payload
                batch.append(json.loads(payload_str))

            if not batch:
                continue

            saved = 0
            discarded = 0
            with SessionLocal() as db:
                for b in batch:
                    try:
                        bid = Bid(
                            id=uuid.uuid4(),
                            auction_id=uuid.UUID(b["auction_id"]),
                            buyer_id=uuid.UUID(b["buyer_id"]),
                            amount=Decimal(str(b["amount"])),
                        )
                        db.add(bid)
                        db.flush()  # raises FK error immediately if buyer missing
                        saved += 1
                    except Exception:
                        db.rollback()
                        discarded += 1
                        # Re-open savepoint so remaining bids can proceed
                        db.begin_nested()

                db.commit()

            if discarded:
                logger.debug("Bids drained: %d saved, %d discarded (FK/ghost)", saved, discarded)

        except Exception as e:
            logger.error(f"Error draining bids queue: {e}")

