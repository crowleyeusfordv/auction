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
    Asynchronously persists a successful Redis bid to PostgreSQL.
    If the DB insertion fails, pushes the bid data to a Redis List for reliable retry.
    """
    try:
        # Create a sync session for the DB insert
        # We use a short-lived session per background task
        with SessionLocal() as db:
            new_bid = Bid(
                id=uuid.uuid4(),
                auction_id=uuid.UUID(auction_id),
                buyer_id=uuid.UUID(buyer_id),
                amount=Decimal(str(amount))
            )
            db.add(new_bid)
            db.commit()
    except Exception as e:
        logger.error(f"Failed to persist bid to Postgres (auction_id={auction_id}, buyer_id={buyer_id}, amount={amount}): {e}")
        try:
            # Fallback: Push to Redis failed_bids_queue
            redis = get_redis()
            payload = json.dumps({
                "auction_id": auction_id,
                "buyer_id": buyer_id,
                "amount": amount
            })
            await redis.rpush("failed_bids_queue", payload)
        except Exception as redis_error:
            logger.error(f"Failed to push bid to Redis retry queue: {redis_error}")

async def drain_failed_bids_queue() -> None:
    """
    Periodically drains the `failed_bids_queue` and retries inserting to DB.
    To be run as a background task.
    """
    import asyncio
    while True:
        await asyncio.sleep(60) # Run every 60 seconds
        try:
            redis = get_redis()
            # Pop one bid from the left of the queue
            # We don't block infinitely to allow graceful shutdown
            while True:
                raw_payload = await redis.lpop("failed_bids_queue")
                if not raw_payload:
                    break
                
                payload_str = raw_payload.decode('utf-8') if isinstance(raw_payload, bytes) else raw_payload
                data = json.loads(payload_str)
                
                # Retry persistence
                # Note: If this fails again, `persist_bid` will catch it and put it back at the end of the queue (rpush).
                await persist_bid(data["auction_id"], data["buyer_id"], data["amount"])
        except Exception as e:
            logger.error(f"Error draining failed bids queue: {e}")
