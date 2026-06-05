import uuid

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import mapped_column

from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "final_price >= 0",
            name="ck_orders_final_price_non_negative",
        ),
        CheckConstraint(
            "status IN ('pending', 'paid', 'cancelled')",
            name="ck_orders_status",
        ),
        UniqueConstraint("auction_id", name="uq_orders_auction_id"),
        Index("ix_orders_buyer_id", "buyer_id"),
        Index("ix_orders_seller_id", "seller_id"),
    )

    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auction_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auctions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    buyer_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    seller_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    final_price = mapped_column(Numeric(12, 2), nullable=False)
    status = mapped_column(
        String,
        default="pending",
        server_default=text("'pending'"),
        nullable=False,
    )
    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
