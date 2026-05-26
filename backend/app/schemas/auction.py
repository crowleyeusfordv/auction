from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuctionStatus(str, Enum):
    NOT_STARTED = "not_started"
    ON_GOING = "on_going"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AuctionBase(BaseModel):
    starting_bid: Decimal | None = Field(default=None, ge=0)
    product_name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    image_url: str | None = None
    video_url: str | None = None
    increment_value: Decimal | None = Field(default=None, ge=0)
    buy_out_price: Decimal | None = Field(default=None, ge=0)
    base_duration: int | None = Field(default=None, gt=0)
    scheduled_time_to_start: datetime | None = None
    is_extended_duration: bool | None = None
    trigger_seconds: int | None = Field(default=None, ge=0)
    seconds_extended: int | None = Field(default=None, ge=0)


class AuctionCreate(AuctionBase):
    seller_id: UUID
    product_name: str = Field(min_length=1)
    increment_value: Decimal = Field(ge=0)


class AuctionUpdate(AuctionBase):
    model_config = ConfigDict(extra="forbid")


class AuctionOut(AuctionBase):
    id: UUID
    seller_id: UUID
    product_name: str
    increment_value: Decimal
    status: AuctionStatus | None

    model_config = ConfigDict(from_attributes=True)