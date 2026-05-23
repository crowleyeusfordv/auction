import uuid
from sqlalchemy import String, Text, Integer, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import mapped_column
from app.db.base import Base

class Auction(Base):
    __tablename__ = "auctions"
    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)# foreign key to users表的id，CASCADE表示用户被删除时相关拍卖也被删除
    product_name = mapped_column(String, nullable=False)
    description = mapped_column(Text)
    image_url = mapped_column(String)
    video_url = mapped_column(String)
    starting_bid = mapped_column(Numeric(12, 2), default=0)
    increment_value = mapped_column(Numeric(12, 2), nullable=False)
    buy_out_price = mapped_column(Numeric(12, 2))
    status = mapped_column(String, default="not_started")
    base_duration = mapped_column(Integer)  # minutes
    scheduled_time_to_start = mapped_column(DateTime(timezone=True))
    is_extended_duration = mapped_column(Boolean, default=False)
    trigger_seconds = mapped_column(Integer)
    seconds_extended = mapped_column(Integer)
