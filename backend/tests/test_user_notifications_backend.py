import asyncio
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.main as main
from app.api.ws.lifecycle import dispatch_final_user_notifications
from app.api.ws.manager import manager
from app.api.ws.auction_state import complete_auction_in_db
from app.api.ws.user_notifications import (
    send_or_persist_notification,
    user_room_key,
)
from app.db.session import DATABASE_URL
from app.models.auction import Auction
from app.models.notification import Notification
from app.models.user import User
from app.schemas.auction import AuctionStatus


engine = create_engine(DATABASE_URL, future=True)
TestingSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


class FakeWebSocket:
    def __init__(self):
        self.sent = []
        self.closed = []

    async def accept(self):
        pass

    async def send_json(self, message):
        self.sent.append(message)

    async def close(self, code=1000):
        self.closed.append(code)


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


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    main.app.dependency_overrides[main.get_db] = override_get_db
    try:
        yield TestClient(main.app)
    finally:
        main.app.dependency_overrides.clear()


def make_user(role="buyer"):
    return User(id=uuid4(), name=f"{role.title()} {uuid4()}", role=role)


def make_auction(seller_id):
    return Auction(
        id=uuid4(),
        seller_id=seller_id,
        product_name="Notification Auction",
        description="Auction with notifications",
        image_url="https://example.test/item.jpg",
        starting_bid=Decimal("0.00"),
        increment_value=Decimal("10.00"),
        buy_out_price=Decimal("100.00"),
        status=AuctionStatus.ON_GOING.value,
        base_duration=1,
        started_at=datetime.now(timezone.utc),
        is_extended_duration=False,
    )


def test_offline_notification_persists_camel_case_payload(db_session):
    seller = make_user("seller")
    buyer = make_user("buyer")
    db_session.add_all([seller, buyer])
    db_session.flush()
    auction = make_auction(seller.id)
    db_session.add(auction)
    db_session.flush()

    payload = {
        "auctionId": str(auction.id),
        "auctionName": auction.product_name,
        "imageUrl": auction.image_url,
        "newAmount": 20.0,
        "yourPosition": 2,
    }

    delivered = asyncio.run(
        send_or_persist_notification(
            db_session,
            user_id=str(buyer.id),
            auction_id=str(auction.id),
            notification_type="outbid",
            payload=payload,
        )
    )

    notification = db_session.query(Notification).filter_by(user_id=buyer.id).one()
    assert delivered is False
    assert notification.type == "outbid"
    assert notification.is_read is False
    assert notification.payload == payload
    assert "auction_id" not in notification.payload
    assert "new_amount" not in notification.payload


def test_online_notification_sends_without_persisting(db_session):
    seller = make_user("seller")
    buyer = make_user("buyer")
    db_session.add_all([seller, buyer])
    db_session.flush()
    auction = make_auction(seller.id)
    db_session.add(auction)
    db_session.flush()

    websocket = FakeWebSocket()
    room_key = user_room_key(str(buyer.id))

    async def run():
        await manager.connect(websocket, room_key, str(buyer.id), buyer.name)
        try:
            return await send_or_persist_notification(
                db_session,
                user_id=str(buyer.id),
                auction_id=str(auction.id),
                notification_type="auction_lost",
                payload={
                    "auctionId": str(auction.id),
                    "auctionName": auction.product_name,
                    "imageUrl": auction.image_url,
                    "finalAmount": 40.0,
                },
            )
        finally:
            await manager.disconnect_all(room_key)

    delivered = asyncio.run(run())

    assert delivered is True
    assert websocket.sent == [
        {
            "type": "auction_lost",
            "payload": {
                "auctionId": str(auction.id),
                "auctionName": auction.product_name,
                "imageUrl": auction.image_url,
                "finalAmount": 40.0,
            },
        }
    ]
    assert db_session.query(Notification).filter_by(user_id=buyer.id).count() == 0


def test_user_ws_delivers_pending_notifications_and_marks_read(client, db_session):
    seller = make_user("seller")
    buyer = make_user("buyer")
    db_session.add_all([seller, buyer])
    db_session.flush()
    auction = make_auction(seller.id)
    db_session.add(auction)
    db_session.flush()

    payload = {
        "auctionId": str(auction.id),
        "auctionName": auction.product_name,
        "imageUrl": auction.image_url,
        "finalAmount": 50.0,
    }
    notification = Notification(
        user_id=buyer.id,
        auction_id=auction.id,
        type="auction_lost",
        payload=payload,
        is_read=False,
    )
    db_session.add(notification)
    db_session.commit()

    with client.websocket_connect(f"/ws/user/{buyer.id}") as websocket:
        message = websocket.receive_json()
        websocket.send_json({"type": "heartbeat"})

    db_session.refresh(notification)
    assert message == {
        "type": "pending_notifications",
        "payload": [{"type": "auction_lost", "payload": payload}],
    }
    assert notification.is_read is True


def test_plural_user_ws_alias_connects(client, db_session):
    buyer = make_user("buyer")
    db_session.add(buyer)
    db_session.commit()

    with client.websocket_connect(f"/ws/users/{buyer.id}") as websocket:
        websocket.send_json({"type": "heartbeat"})


def test_final_user_notifications_persist_for_winner_and_losers(db_session):
    seller = make_user("seller")
    winner = make_user("buyer")
    loser = make_user("buyer")
    observer = make_user("buyer")
    db_session.add_all([seller, winner, loser, observer])
    db_session.flush()
    auction = make_auction(seller.id)
    db_session.add(auction)
    db_session.flush()

    complete_auction_in_db(db_session, str(auction.id), str(winner.id), 70.0)

    asyncio.run(
        dispatch_final_user_notifications(
            db_session,
            auction,
            participant_ids=[str(winner.id), str(loser.id)],
            winner_id=str(winner.id),
            final_amount=70.0,
        )
    )

    notifications = db_session.query(Notification).order_by(Notification.type).all()
    notifications_by_user = {notification.user_id: notification for notification in notifications}

    assert set(notifications_by_user) == {winner.id, loser.id}
    assert notifications_by_user[winner.id].type == "auction_won"
    assert notifications_by_user[winner.id].payload["auctionId"] == str(auction.id)
    assert notifications_by_user[winner.id].payload["finalAmount"] == 70.0
    assert notifications_by_user[winner.id].payload["orderId"]
    assert notifications_by_user[loser.id].type == "auction_lost"
    assert notifications_by_user[loser.id].payload == {
        "auctionId": str(auction.id),
        "auctionName": auction.product_name,
        "imageUrl": auction.image_url,
        "finalAmount": 70.0,
    }
    assert observer.id not in notifications_by_user
