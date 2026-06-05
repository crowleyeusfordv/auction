from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import Field, model_validator

from app.schemas.base import SnakeModel, snake_config


class AuctionStatus(str, Enum):
    NOT_STARTED = "not_started"
    ON_GOING = "on_going"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AuctionBase(SnakeModel):
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

    @model_validator(mode="before")
    @classmethod
    def normalize_extended_duration(cls, data):
        if not isinstance(data, dict):
            return data

        payload = dict(data)
        extended_duration = payload.pop("extendedDuration", None)

        if isinstance(extended_duration, dict):
            seconds_added = extended_duration.get("secondsAdded")
            payload.setdefault("is_extended_duration", True)
            payload.setdefault("trigger_seconds", extended_duration.get("trigger"))
            payload.setdefault("seconds_extended", seconds_added)

        return payload


class AuctionCreate(AuctionBase):
    seller_id: UUID
    product_name: str = Field(min_length=1)
    increment_value: Decimal = Field(ge=0)


class AuctionUpdate(AuctionBase):
    model_config = snake_config(extra="forbid")


class AuctionOut(AuctionBase):
    id: UUID
    seller_id: UUID
    product_name: str
    increment_value: Decimal
    status: AuctionStatus | None
    started_at: datetime | None = None
    ended_at: datetime | None = None

    model_config = snake_config(from_attributes=True)


class AuctionPaginationOut(SnakeModel):
    limit: int
    offset: int | None = None
    total: int | None = None
    has_more: bool
    next_cursor: str | None = None


class AuctionListOut(SnakeModel):
    items: list[AuctionOut]
    pagination: AuctionPaginationOut
    model_config = snake_config(from_attributes=True)
