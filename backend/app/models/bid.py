import uuid
from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import mapped_column
from app.db.base import Base

class Bid(Base):
    __tablename__ = "bids"
    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auction_id = mapped_column(UUID(as_uuid=True), ForeignKey("auctions.id", ondelete="CASCADE"), nullable=False)
    buyer_id = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = mapped_column(Numeric(12, 2), nullable=False)
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)