from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.schemas.base import SnakeModel

class UserBidOut(SnakeModel):
    id: UUID
    amount: Decimal
    created_at: datetime

class ParticipatedAuctionOut(SnakeModel):
    auction_id: UUID
    product_name: str
    image_url: Optional[str]
    video_url: Optional[str] = None
    status: str
    highest_bid: Decimal
    user_bids: List[UserBidOut]
