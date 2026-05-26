import secrets
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.auction import Auction
from app.models.user import User
from app.schemas.auction import (
    AuctionCreate,
    AuctionOut,
    AuctionStatus,
    AuctionUpdate,
)
from app.schemas.user import GuestUserCreate
from app.schemas.user import GuestUserOut
from app.schemas.user import UserCreate
from app.schemas.user import UserOut


app = FastAPI()

# Define the root endpoint to return a welcome message and a link to the API documentation
@app.get("/")
def root():
    return {
        "message": "Auction API is running",
        "docs": "/docs"
    }
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_guest_name() -> str:
    return f"Guest_{secrets.randbelow(100_000_000):08d}"

"""
Create a new user with the given name and role. 
But we haven't set authentication yet, so we will just create a users/guest. 
No need to consider this endpoint now, but we will need it in the future when we implement authentication.
"""
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
def create_auction(payload: AuctionCreate, db: Session = Depends(get_db)):
    seller = db.get(User, payload.seller_id)

    if seller is None:
        raise HTTPException(status_code=404, detail="Seller not found")

    if seller.role != "seller":
        raise HTTPException(status_code=403, detail="User is not a seller")

    if payload.scheduled_time_to_start is None:
        status = AuctionStatus.ON_GOING
    else:
        status = AuctionStatus.NOT_STARTED

    auction = Auction(
        seller_id=payload.seller_id,
        starting_bid=payload.starting_bid,
        product_name=payload.product_name,
        description=payload.description,
        image_url=payload.image_url,
        video_url=payload.video_url,
        increment_value=payload.increment_value,
        buy_out_price=payload.buy_out_price,
        status=status,
        base_duration=payload.base_duration,
        scheduled_time_to_start=payload.scheduled_time_to_start,
        is_extended_duration=payload.is_extended_duration,
        trigger_seconds=payload.trigger_seconds,
        seconds_extended=payload.seconds_extended,
    )

    db.add(auction)
    db.commit()
    db.refresh(auction)

    return auction

# Return all auctions. If seller_id is provided, return only auctions created by that seller.
@app.get("/auctions", response_model=list[AuctionOut])
def list_auctions(
    seller_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Auction)

    if seller_id is not None:
        query = query.filter(Auction.seller_id == seller_id)

    auctions = query.all()

    return auctions

# Update an auction before it starts.
# Only auctions with the `not_started` status can be edited.
# Only fields explicitly provided in the request body will be updated.
@app.put("/auctions/{auction_id}", response_model=AuctionOut)
def edit_auction(
    auction_id: UUID,
    payload: AuctionUpdate,
    db: Session = Depends(get_db),
):
    auction = db.get(Auction, auction_id)

    if auction is None:
        raise HTTPException(status_code=404, detail="Auction not found")

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
@app.patch("/api/auctions/{auction_id}/status", response_model=AuctionOut)
def update_auction_status(
    auction_id: UUID,
    db: Session = Depends(get_db),
):
    auction = db.get(Auction, auction_id)

    if auction is None:
        raise HTTPException(
            status_code=404,
            detail="This auction does not exist",
        )

    if auction.status == AuctionStatus.COMPLETED.value:
        raise HTTPException(
            status_code=400,
            detail="This auction is already completed",
        )

    auction.status = AuctionStatus.CANCELLED.value

    db.commit()
    db.refresh(auction)

    return auction