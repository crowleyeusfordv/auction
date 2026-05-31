from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.main as main
from app.db.session import DATABASE_URL
from app.models.auction import Auction
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


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    main.app.dependency_overrides[main.get_db] = override_get_db
    try:
        yield TestClient(main.app)
    finally:
        main.app.dependency_overrides.clear()


@pytest.fixture()
def auction_data(db_session):
    now = datetime(2026, 5, 30, 12, 0, tzinfo=timezone.utc)
    seller = User(id=uuid4(), name=f"Seller {uuid4()}", role="seller")
    other_seller = User(id=uuid4(), name=f"Seller {uuid4()}", role="seller")
    db_session.add_all([seller, other_seller])
    db_session.flush()

    auctions = [
        make_auction(
            UUID("00000000-0000-0000-0000-000000000005"),
            seller.id,
            "Newest",
            AuctionStatus.ON_GOING.value,
            started_at=now + timedelta(minutes=4),
        ),
        make_auction(
            UUID("00000000-0000-0000-0000-000000000004"),
            seller.id,
            "Tie high id",
            AuctionStatus.ON_GOING.value,
            started_at=now + timedelta(minutes=3),
        ),
        make_auction(
            UUID("00000000-0000-0000-0000-000000000003"),
            seller.id,
            "Tie low id",
            AuctionStatus.NOT_STARTED.value,
            scheduled_time_to_start=now + timedelta(minutes=3),
        ),
        make_auction(
            UUID("00000000-0000-0000-0000-000000000002"),
            seller.id,
            "Older",
            AuctionStatus.COMPLETED.value,
            started_at=now + timedelta(minutes=2),
        ),
        make_auction(
            UUID("00000000-0000-0000-0000-000000000001"),
            seller.id,
            "Other seller",
            AuctionStatus.ON_GOING.value,
            started_at=now + timedelta(minutes=1),
        ),
        make_auction(
            UUID("00000000-0000-0000-0000-000000000000"),
            other_seller.id,
            "Filtered other seller",
            AuctionStatus.ON_GOING.value,
            started_at=now,
        ),
    ]
    db_session.add_all(auctions)
    db_session.flush()

    return {
        "seller": seller,
        "other_seller": other_seller,
        "auctions": auctions,
    }


def make_auction(
    auction_id,
    seller_id,
    product_name,
    status,
    *,
    started_at=None,
    scheduled_time_to_start=None,
):
    return Auction(
        id=auction_id,
        seller_id=seller_id,
        product_name=product_name,
        description=f"{product_name} description",
        starting_bid=Decimal("0.00"),
        increment_value=Decimal("10.00"),
        buy_out_price=Decimal("100.00"),
        status=status,
        base_duration=10,
        scheduled_time_to_start=scheduled_time_to_start,
        started_at=started_at,
        is_extended_duration=False,
    )


def item_ids(response_json):
    return [item["id"] for item in response_json["items"]]


def test_default_offset_wrapper_and_total(client, auction_data):
    response = client.get(
        "/auctions",
        params={"seller_id": str(auction_data["seller"].id)},
    )

    assert response.status_code == 200
    body = response.json()
    assert item_ids(body) == [
        "00000000-0000-0000-0000-000000000005",
        "00000000-0000-0000-0000-000000000004",
        "00000000-0000-0000-0000-000000000003",
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000001",
    ]
    assert body["pagination"] == {
        "limit": 10,
        "offset": 0,
        "total": 5,
        "has_more": False,
        "next_cursor": None,
    }


def test_offset_pagination_uses_filtered_total(client, auction_data):
    seller_id = auction_data["seller"].id
    excluded_id = auction_data["auctions"][0].id

    response = client.get(
        "/auctions",
        params={
            "seller_id": str(seller_id),
            "exclude_id": str(excluded_id),
            "limit": 2,
            "offset": 1,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert item_ids(body) == [
        "00000000-0000-0000-0000-000000000003",
        "00000000-0000-0000-0000-000000000002",
    ]
    assert body["pagination"] == {
        "limit": 2,
        "offset": 1,
        "total": 4,
        "has_more": True,
        "next_cursor": None,
    }


def test_status_filter(client, auction_data):
    response = client.get(
        "/auctions",
        params={
            "seller_id": str(auction_data["seller"].id),
            "status": "on_going",
        },
    )

    assert response.status_code == 200
    assert item_ids(response.json()) == [
        "00000000-0000-0000-0000-000000000005",
        "00000000-0000-0000-0000-000000000004",
        "00000000-0000-0000-0000-000000000001",
    ]


def test_camel_case_query_aliases(client, auction_data):
    response = client.get(
        "/auctions",
        params={
            "sellerId": str(auction_data["seller"].id),
            "excludeId": "00000000-0000-0000-0000-000000000005",
        },
    )

    assert response.status_code == 200
    assert item_ids(response.json()) == [
        "00000000-0000-0000-0000-000000000004",
        "00000000-0000-0000-0000-000000000003",
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000001",
    ]


def test_cursor_pagination_uses_composite_cursor_for_tied_feed_time(client, auction_data):
    first_response = client.get(
        "/auctions",
        params={"seller_id": str(auction_data["seller"].id), "limit": 2},
    )

    assert first_response.status_code == 200
    first_body = first_response.json()
    cursor = first_body["pagination"]["next_cursor"]
    assert cursor is None

    cursor = main.encode_auction_cursor(
        auction_data["auctions"][1].started_at,
        auction_data["auctions"][1].id,
    )
    second_response = client.get(
        "/auctions",
        params={
            "seller_id": str(auction_data["seller"].id),
            "limit": 2,
            "cursor": cursor,
        },
    )

    assert second_response.status_code == 200
    second_body = second_response.json()
    assert item_ids(second_body) == [
        "00000000-0000-0000-0000-000000000003",
        "00000000-0000-0000-0000-000000000002",
    ]
    assert second_body["pagination"]["offset"] is None
    assert second_body["pagination"]["total"] is None
    assert second_body["pagination"]["has_more"] is True
    assert second_body["pagination"]["next_cursor"] is not None


def test_cursor_last_page_has_null_next_cursor(client, auction_data):
    cursor = main.encode_auction_cursor(
        auction_data["auctions"][2].scheduled_time_to_start,
        auction_data["auctions"][2].id,
    )

    response = client.get(
        "/auctions",
        params={
            "seller_id": str(auction_data["seller"].id),
            "limit": 10,
            "cursor": cursor,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert item_ids(body) == [
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000001",
    ]
    assert body["pagination"]["has_more"] is False
    assert body["pagination"]["next_cursor"] is None
    assert body["pagination"]["total"] is None


def test_cursor_and_explicit_offset_are_mutually_exclusive(client, auction_data):
    cursor = main.encode_auction_cursor(
        auction_data["auctions"][0].started_at,
        auction_data["auctions"][0].id,
    )

    response = client.get("/auctions", params={"cursor": cursor, "offset": 0})

    assert response.status_code == 400


def test_invalid_cursor_returns_400(client, auction_data):
    response = client.get("/auctions", params={"cursor": "not-a-cursor"})

    assert response.status_code == 400


def test_limit_bounds_are_validated(client, auction_data):
    low_response = client.get("/auctions", params={"limit": 0})
    high_response = client.get("/auctions", params={"limit": 101})

    assert low_response.status_code == 422
    assert high_response.status_code == 422
