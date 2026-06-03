import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.ws.auction_state import (
    auction_key,
    build_room_state,
    complete_auction_in_db,
    initialize_auction_state,
    now_ms,
)
from app.core.lua_scripts import execute_place_bid
from app.core.redis_client import close_redis, get_redis, init_redis
from app.db.session import DATABASE_URL
from app.models.auction import Auction
from app.models.order import Order
from app.models.user import User
from app.schemas.auction import AuctionStatus


engine = create_engine(DATABASE_URL, future=True)
TestingSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


async def cleanup_redis_auction(redis, auction_id: str) -> None:
    await redis.delete(
        auction_key(auction_id, "active"),
        auction_key(auction_id, "current_bid"),
        auction_key(auction_id, "ends_at"),
        auction_key(auction_id, "ranking"),
        auction_key(auction_id, "leader"),
        auction_key(auction_id, "finalized"),
    )
    await redis.srem("auctions:active", auction_id)


def make_live_auction(seller_id, **overrides):
    values = {
        "id": uuid4(),
        "seller_id": seller_id,
        "product_name": f"Auction {uuid4()}",
        "description": "Live auction",
        "starting_bid": Decimal("0.00"),
        "increment_value": Decimal("10.00"),
        "buy_out_price": Decimal("25.00"),
        "status": AuctionStatus.ON_GOING.value,
        "base_duration": 1,
        "started_at": datetime.now(timezone.utc),
        "is_extended_duration": True,
        "trigger_seconds": 10,
        "seconds_extended": 30,
    }
    values.update(overrides)
    return Auction(**values)


def test_room_state_snapshot_includes_required_live_fields(db_session):
    seller = User(id=uuid4(), name=f"Seller {uuid4()}", role="seller")
    buyer = User(id=uuid4(), name=f"Buyer {uuid4()}", role="buyer")
    db_session.add_all([seller, buyer])
    db_session.flush()
    auction = make_live_auction(seller.id)
    db_session.add(auction)
    db_session.flush()

    async def run():
        await init_redis()
        redis = get_redis()
        try:
            await initialize_auction_state(redis, auction)
            payload = await build_room_state(redis, db_session, auction, str(buyer.id))

            assert payload["current_bid"] == 0.0
            assert payload["increment_value"] == 10.0
            assert payload["seconds_remaining"] > 0
            assert payload["remaining_ms"] > 0
            assert payload["leader"] is None
            assert payload["ranking"] == []
            assert "viewer_count" in payload
        finally:
            await cleanup_redis_auction(redis, str(auction.id))
            await close_redis()

    asyncio.run(run())


def test_lua_bid_pipeline_extends_timer_and_caps_at_buyout(db_session):
    seller = User(id=uuid4(), name=f"Seller {uuid4()}", role="seller")
    buyer = User(id=uuid4(), name=f"Buyer {uuid4()}", role="buyer")
    db_session.add_all([seller, buyer])
    db_session.flush()
    auction = make_live_auction(
        seller.id,
        started_at=datetime.now(timezone.utc) - timedelta(seconds=55),
        buy_out_price=Decimal("15.00"),
    )
    db_session.add(auction)
    db_session.flush()

    async def run():
        await init_redis()
        redis = get_redis()
        try:
            await initialize_auction_state(redis, auction)
            first = await execute_place_bid(
                str(auction.id),
                str(buyer.id),
                float(auction.increment_value),
                now_ms=now_ms(),
                trigger_seconds=auction.trigger_seconds,
                seconds_extended=auction.seconds_extended,
                buy_out_price=float(auction.buy_out_price),
            )
            assert not isinstance(first, str)
            assert first[0] == 10.0
            assert first[3] is True
            assert first[4] is False

            second = await execute_place_bid(
                str(auction.id),
                str(buyer.id),
                float(auction.increment_value),
                now_ms=now_ms(),
                trigger_seconds=auction.trigger_seconds,
                seconds_extended=auction.seconds_extended,
                buy_out_price=float(auction.buy_out_price),
            )
            assert not isinstance(second, str)
            assert second[0] == 15.0
            assert second[4] is True
            assert await redis.get(auction_key(str(auction.id), "active")) == "0"
        finally:
            await cleanup_redis_auction(redis, str(auction.id))
            await close_redis()

    asyncio.run(run())


def test_lua_bid_pipeline_returns_previous_leader(db_session):
    seller = User(id=uuid4(), name=f"Seller {uuid4()}", role="seller")
    first_buyer = User(id=uuid4(), name=f"Buyer {uuid4()}", role="buyer")
    second_buyer = User(id=uuid4(), name=f"Buyer {uuid4()}", role="buyer")
    db_session.add_all([seller, first_buyer, second_buyer])
    db_session.flush()
    auction = make_live_auction(seller.id, buy_out_price=Decimal("100.00"))
    db_session.add(auction)
    db_session.flush()

    async def run():
        await init_redis()
        redis = get_redis()
        try:
            await initialize_auction_state(redis, auction)
            first = await execute_place_bid(
                str(auction.id),
                str(first_buyer.id),
                float(auction.increment_value),
                now_ms=now_ms(),
                trigger_seconds=auction.trigger_seconds,
                seconds_extended=auction.seconds_extended,
                buy_out_price=float(auction.buy_out_price),
            )
            assert not isinstance(first, str)
            assert first[5] == str(first_buyer.id)
            assert first[6] is None

            second = await execute_place_bid(
                str(auction.id),
                str(second_buyer.id),
                float(auction.increment_value),
                now_ms=now_ms(),
                trigger_seconds=auction.trigger_seconds,
                seconds_extended=auction.seconds_extended,
                buy_out_price=float(auction.buy_out_price),
            )
            assert not isinstance(second, str)
            assert second[5] == str(second_buyer.id)
            assert second[6] == str(first_buyer.id)
        finally:
            await cleanup_redis_auction(redis, str(auction.id))
            await close_redis()

    asyncio.run(run())


def test_lua_rejects_inactive_auction(db_session):
    seller = User(id=uuid4(), name=f"Seller {uuid4()}", role="seller")
    buyer = User(id=uuid4(), name=f"Buyer {uuid4()}", role="buyer")
    db_session.add_all([seller, buyer])
    db_session.flush()
    auction = make_live_auction(seller.id, status=AuctionStatus.NOT_STARTED.value)
    db_session.add(auction)
    db_session.flush()

    async def run():
        await init_redis()
        redis = get_redis()
        try:
            await initialize_auction_state(redis, auction)
            result = await execute_place_bid(
                str(auction.id),
                str(buyer.id),
                float(auction.increment_value),
                now_ms=now_ms(),
                trigger_seconds=auction.trigger_seconds,
                seconds_extended=auction.seconds_extended,
                buy_out_price=float(auction.buy_out_price),
            )
            assert result == "ERR_INACTIVE"
        finally:
            await cleanup_redis_auction(redis, str(auction.id))
            await close_redis()

    asyncio.run(run())


def test_complete_auction_creates_pending_order(db_session):
    seller = User(id=uuid4(), name=f"Seller {uuid4()}", role="seller")
    buyer = User(id=uuid4(), name=f"Buyer {uuid4()}", role="buyer")
    db_session.add_all([seller, buyer])
    db_session.flush()
    auction = make_live_auction(seller.id)
    db_session.add(auction)
    db_session.flush()

    complete_auction_in_db(db_session, str(auction.id), str(buyer.id), 42.0)

    order = db_session.query(Order).filter(Order.auction_id == auction.id).one()
    assert auction.status == AuctionStatus.COMPLETED.value
    assert auction.ended_at is not None
    assert order.buyer_id == buyer.id
    assert order.seller_id == seller.id
    assert order.final_price == Decimal("42.00")
    assert order.status == "pending"
