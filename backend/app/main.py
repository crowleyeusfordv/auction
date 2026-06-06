from contextlib import asynccontextmanager
import base64
import binascii
import json
import os
import secrets
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.auction import Auction
from app.models.user import User
from app.models.order import Order
from app.schemas.base import query_aliases
from app.schemas.auction import (
    AuctionCreate,
    AuctionListOut,
    AuctionOut,
    AuctionStatus,
    AuctionUpdate,
)
from app.schemas.user import GuestUserCreate
from app.schemas.user import GuestUserOut
from app.schemas.user import UserCreate
from app.schemas.user import UserOut
from app.schemas.order import OrderOut
from app.schemas.bid import ParticipatedAuctionOut

from app.core.redis_client import close_redis, get_redis, init_redis, redis_healthcheck
from app.api.ws import ws_router
from app.api.upload import upload_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    import asyncio
    from app.api.ws.manager import manager
    from app.api.ws.bid_persist import drain_failed_bids_queue
    from app.api.ws.lifecycle import start_timer_monitor, start_scheduler_monitor
    prune_task = asyncio.create_task(manager.start_heartbeat_pruning())
    drain_task = asyncio.create_task(drain_failed_bids_queue())
    timer_task = asyncio.create_task(start_timer_monitor())
    scheduler_task = asyncio.create_task(start_scheduler_monitor())
    try:
        yield
    finally:
        prune_task.cancel()
        drain_task.cancel()
        timer_task.cancel()
        scheduler_task.cancel()
        
        try:
            await asyncio.gather(prune_task, drain_task, timer_task, scheduler_task, return_exceptions=True)
        except asyncio.CancelledError:
            pass
            
        await close_redis()

app = FastAPI(lifespan=lifespan)

# Define the root endpoint to return a welcome message and a link to the API documentation
@app.get("/")
def root():
    return {
        "message": "Auction API is running",
        "docs": "/docs"
    }


@app.get("/health/redis")
async def redis_health():
    return {"redis": "ok", "ping": await redis_healthcheck()}


frontend_url = os.getenv("FRONTEND_URL")
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    frontend_url
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(upload_router)


def generate_guest_name() -> str:
    return f"Guest_{secrets.randbelow(100_000_000):08d}"


def apply_optional_filters(query, filters):
    for column, value in filters:
        if value is not None:
            if isinstance(value, Enum):
                value = value.value

            query = query.filter(column == value)

    return query


def get_auction_feed_time():
    return func.coalesce(Auction.started_at, Auction.scheduled_time_to_start)


def encode_auction_cursor(feed_time: datetime, auction_id: UUID) -> str:
    payload = {
        "feed_time": feed_time.isoformat(),
        "id": str(auction_id),
    }
    raw_cursor = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    return base64.urlsafe_b64encode(raw_cursor).decode("ascii")


def decode_auction_cursor(cursor: str) -> tuple[datetime, UUID]:
    try:
        padded_cursor = cursor + "=" * (-len(cursor) % 4)
        raw_cursor = base64.urlsafe_b64decode(padded_cursor.encode("ascii"))
        payload = json.loads(raw_cursor.decode("utf-8"))
        feed_time = datetime.fromisoformat(payload["feed_time"])
        auction_id = UUID(payload["id"])
    except (
        KeyError,
        TypeError,
        ValueError,
        UnicodeDecodeError,
        binascii.Error,
        json.JSONDecodeError,
    ):
        raise HTTPException(status_code=400, detail="Invalid cursor")

    if feed_time.tzinfo is None or feed_time.utcoffset() is None:
        raise HTTPException(status_code=400, detail="Cursor feed_time must include timezone")

    return feed_time, auction_id


def get_uuid_query_alias(request: Request, alias: str) -> UUID | None:
    value = request.query_params.get(alias)

    if value is None:
        return None

    try:
        return UUID(value)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid {alias}")


def build_auction_cursor(item) -> str | None:
    auction, feed_time = item

    if feed_time is None:
        return None

    return encode_auction_cursor(feed_time, auction.id)


def build_auction_list_query(
    db: Session,
    seller_id: UUID | None,
    status: AuctionStatus | None,
    exclude_id: UUID | None,
):
    query = apply_optional_filters(
        db.query(Auction),
        (
            (Auction.seller_id, seller_id),
            (Auction.status, status),
        ),
    )

    if exclude_id is not None:
        query = query.filter(Auction.id != exclude_id)

    return query


def order_auction_list_query(query, feed_time):
    return query.order_by(feed_time.desc().nulls_last(), Auction.id.desc())


def build_auction_list_response(
    items,
    *,
    limit: int,
    offset: int | None,
    total: int | None,
    has_more: bool,
    next_cursor: str | None,
):
    return {
        "items": items,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": total,
            "has_more": has_more,
            "next_cursor": next_cursor,
        },
    }


def paginate_auctions_by_cursor(query, feed_time, cursor: str, limit: int):
    cursor_feed_time, cursor_id = decode_auction_cursor(cursor)
    page_query = (
        query
        .add_columns(feed_time.label("feed_time"))
        .filter(
            or_(
                feed_time < cursor_feed_time,
                (feed_time == cursor_feed_time) & (Auction.id < cursor_id),
            )
        )
    )
    rows = order_auction_list_query(page_query, feed_time).limit(limit + 1).all()
    page_rows = rows[:limit]
    has_more = len(rows) > limit

    return build_auction_list_response(
        [auction for auction, _ in page_rows],
        limit=limit,
        offset=None,
        total=None,
        has_more=has_more,
        next_cursor=build_auction_cursor(page_rows[-1]) if has_more and page_rows else None,
    )


def paginate_auctions_by_offset(query, feed_time, offset: int | None, limit: int):
    effective_offset = offset or 0
    total = query.count()
    items = (
        order_auction_list_query(query, feed_time)
        .offset(effective_offset)
        .limit(limit)
        .all()
    )

    return build_auction_list_response(
        items,
        limit=limit,
        offset=effective_offset,
        total=total,
        has_more=effective_offset + len(items) < total,
        next_cursor=None,
    )


def mark_auction_on_going(auction: Auction) -> None:
    auction.status = AuctionStatus.ON_GOING.value

    if auction.started_at is None:
        auction.started_at = datetime.now(timezone.utc)


def get_auction_or_404(
    db: Session,
    auction_id: UUID,
    detail: str = "Auction not found",
) -> Auction:
    auction = db.get(Auction, auction_id)

    if auction is None:
        raise HTTPException(status_code=404, detail=detail)

    return auction


@app.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(name=payload.name, role=payload.role)
    db.add(user)

    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="User name already exists")

# Create a guest user with a randomly generated name. 
@app.post("/users/guest", response_model=GuestUserOut)
def create_guest_user(payload: GuestUserCreate, db: Session = Depends(get_db)):
    for _ in range(10):
        user = User(name=generate_guest_name(), role=payload.role)
        db.add(user)

        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()

    raise HTTPException(status_code=500, detail="Could not generate a unique guest name")


@app.post("/auctions", response_model=AuctionOut, status_code=201)
async def create_auction(payload: AuctionCreate, db: Session = Depends(get_db)):
    seller = db.get(User, payload.seller_id)

    if seller is None:
        raise HTTPException(status_code=404, detail="Seller not found")

    if seller.role != "seller":
        raise HTTPException(status_code=403, detail="User is not a seller")

    auction = Auction(
        seller_id=payload.seller_id,
        starting_bid=payload.starting_bid,
        product_name=payload.product_name,
        description=payload.description,
        image_url=payload.image_url,
        video_url=payload.video_url,
        increment_value=payload.increment_value,
        buy_out_price=payload.buy_out_price,
        status=AuctionStatus.NOT_STARTED.value,
        base_duration=payload.base_duration,
        scheduled_time_to_start=payload.scheduled_time_to_start,
        is_extended_duration=payload.is_extended_duration,
        trigger_seconds=payload.trigger_seconds,
        seconds_extended=payload.seconds_extended,
    )

    if payload.scheduled_time_to_start is None:
        mark_auction_on_going(auction)

    db.add(auction)
    db.commit()
    db.refresh(auction)

    if auction.status == AuctionStatus.ON_GOING.value:
        from app.core.redis_client import get_redis
        from app.api.ws.auction_state import initialize_auction_state
        redis = get_redis()
        await initialize_auction_state(redis, auction)

    return auction

async def enrich_auctions_with_bid_data(db: Session, auctions: list):
    from app.core.redis_client import get_redis
    from app.models.bid import Bid
    from app.models.order import Order
    
    if not auctions:
        return auctions
        
    redis = get_redis()
    auction_ids = [a.id for a in auctions]
    
    bid_counts = db.query(Bid.auction_id, func.count(Bid.id)).filter(Bid.auction_id.in_(auction_ids)).group_by(Bid.auction_id).all()
    bid_counts_map = {str(a_id): count for a_id, count in bid_counts}
    
    orders = db.query(Order.auction_id, Order.final_price).filter(Order.auction_id.in_(auction_ids)).all()
    orders_map = {str(a_id): price for a_id, price in orders}
    
    for auction in auctions:
        aid = str(auction.id)
        current_bid = float(auction.starting_bid) if auction.starting_bid is not None else 0.0
        times_bidded = bid_counts_map.get(aid, 0)
        
        if auction.status == "on_going":
            try:
                redis_current_bid = await redis.get(f"auction:{aid}:current_bid")
                if redis_current_bid is not None:
                    current_bid = float(redis_current_bid)
            except Exception:
                pass
        elif auction.status == "completed":
            if aid in orders_map:
                current_bid = float(orders_map[aid])
                
        setattr(auction, "current_bid", current_bid)
        setattr(auction, "times_bidded", times_bidded)
        
    return auctions


# Return auctions for list pages and live-room feeds.
@app.get("/auctions", response_model=AuctionListOut)
async def list_auctions(
    request: Request,
    seller_id: UUID | None = Query(
        default=None,
        validation_alias=query_aliases("seller_id"),
        serialization_alias="seller_id",
    ),
    status: AuctionStatus | None = Query(default=None),
    exclude_id: UUID | None = Query(
        default=None,
        validation_alias=query_aliases("exclude_id"),
        serialization_alias="exclude_id",
    ),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int | None = Query(default=None, ge=0),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if cursor is not None and offset is not None:
        raise HTTPException(
            status_code=400,
            detail="cursor and offset are mutually exclusive",
        )

    seller_id = seller_id or get_uuid_query_alias(request, "sellerId")
    exclude_id = exclude_id or get_uuid_query_alias(request, "excludeId")

    feed_time = get_auction_feed_time()
    query = build_auction_list_query(db, seller_id, status, exclude_id)

    if cursor is not None:
        result = paginate_auctions_by_cursor(query, feed_time, cursor, limit)
    else:
        result = paginate_auctions_by_offset(query, feed_time, offset, limit)

    result["items"] = await enrich_auctions_with_bid_data(db, result["items"])
    return result


@app.get("/auctions/{auction_id}", response_model=AuctionOut)
async def get_auction(auction_id: UUID, db: Session = Depends(get_db)):
    auction = get_auction_or_404(db, auction_id)
    enriched = await enrich_auctions_with_bid_data(db, [auction])
    return enriched[0]

@app.get("/bids", response_model=list[ParticipatedAuctionOut])
async def get_participated_auctions(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    from app.models.bid import Bid
    # Fetch all bids for this user
    bids = db.query(Bid, Auction).join(Auction, Bid.auction_id == Auction.id).filter(Bid.buyer_id == user_id).order_by(Bid.created_at.desc()).all()
    
    auction_bids = {}
    for bid, auction in bids:
        if auction.id not in auction_bids:
            auction_bids[auction.id] = {
                "auction": auction,
                "user_bids": []
            }
        auction_bids[auction.id]["user_bids"].append({
            "id": bid.id,
            "amount": bid.amount,
            "created_at": bid.created_at
        })
        
    auctions = [data["auction"] for data in auction_bids.values()]
    enriched_auctions = await enrich_auctions_with_bid_data(db, auctions)
    
    result = []
    for auction in enriched_auctions:
        data = auction_bids[auction.id]
        result.append({
            "auction_id": auction.id,
            "product_name": auction.product_name,
            "image_url": auction.image_url,
            "video_url": auction.video_url,
            "status": auction.status,
            "highest_bid": getattr(auction, "current_bid", 0.0),
            "user_bids": data["user_bids"]
        })
        
    return result


# Update an auction before it starts.
# Only auctions with the `not_started` status can be edited.
# Only fields explicitly provided in the request body will be updated.
@app.put("/auctions/{auction_id}", response_model=AuctionOut)
def edit_auction(
    auction_id: UUID,
    payload: AuctionUpdate,
    db: Session = Depends(get_db),
):
    auction = get_auction_or_404(db, auction_id)

    if auction.seller_id != payload.seller_id:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to edit this auction",
        )

    if auction.status != AuctionStatus.NOT_STARTED.value:
        raise HTTPException(
            status_code=400,
            detail="Auction can only be edited before it starts",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    for field_name, field_value in update_data.items():
        setattr(auction, field_name, field_value)

    db.commit()
    db.refresh(auction)

    return auction

# If the auction is already completed, then return "This auction is already completed" error. 
# If the auction is not completed, cancel the auction.
@app.patch("/auctions/{auction_id}/status", response_model=AuctionOut)
async def update_auction_status(
    auction_id: UUID,
    db: Session = Depends(get_db),
):
    auction = get_auction_or_404(
        db,
        auction_id,
        detail="This auction does not exist",
    )

    if auction.status == AuctionStatus.COMPLETED.value:
        raise HTTPException(
            status_code=400,
            detail="This auction is already completed",
        )

    auction.status = AuctionStatus.CANCELLED.value
    auction.ended_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(auction)

    try:
        redis = get_redis()
        await redis.set(f"auction:{auction_id}:active", "0")
        await redis.srem("auctions:active", str(auction_id))

        from app.api.ws.manager import manager

        await manager.broadcast(
            "auction_cancelled",
            {"reason": "Auction was cancelled by the seller."},
            str(auction_id),
        )
    except Exception:
        pass

    return auction


@app.get("/sellers/{seller_id}/orders", response_model=list[OrderOut])
def get_orders_by_seller(seller_id: UUID, db: Session = Depends(get_db)):
    results = (
        db.query(Order, Auction, User)
        .join(Auction, Order.auction_id == Auction.id)
        .join(User, Order.buyer_id == User.id)
        .filter(Order.seller_id == seller_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    
    return [
        {
            "id": order.id,
            "productName": auction.product_name,
            "productImage": auction.image_url,
            "winnerName": user.name,
            "dateSold": order.created_at,
            "price": float(order.final_price)
        }
        for order, auction, user in results
    ]


@app.get("/auctions/{auction_id}/order")
def get_order_by_auction(auction_id: UUID, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.auction_id == auction_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for this auction")
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    
    return {
        "orderId": order.id,
        "productName": auction.product_name,
        "productImage": auction.image_url,
        "finalPrice": float(order.final_price),
        "status": order.status,
        "buyerId": order.buyer_id
    }


@app.post("/orders/{order_id}/pay")
def pay_order(
    order_id: UUID,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    buyer_id_str = authorization.split("Bearer ")[1].strip()
    try:
        buyer_id = UUID(buyer_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid buyer_id in token")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.buyer_id != buyer_id:
        raise HTTPException(status_code=403, detail="Not authorized to pay this order")
        
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Order is not pending")
        
    order.status = "paid"
    db.commit()
    
    return {"message": "Success"}
