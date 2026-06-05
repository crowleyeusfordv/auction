"""add orders table

Revision ID: b7d8e2f4a913
Revises: a8c9d2e4f6b1
Create Date: 2026-05-28 00:00:00.000000

"""

from typing import Sequence
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b7d8e2f4a913"
down_revision: Union[str, None] = "a8c9d2e4f6b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("auction_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("final_price", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "status",
            sa.String(),
            server_default=sa.text("'pending'"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "final_price >= 0",
            name="ck_orders_final_price_non_negative",
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'paid', 'cancelled')",
            name="ck_orders_status",
        ),
        sa.ForeignKeyConstraint(
            ["auction_id"],
            ["auctions.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["buyer_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["seller_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("auction_id", name="uq_orders_auction_id"),
    )
    op.create_index("ix_orders_buyer_id", "orders", ["buyer_id"], unique=False)
    op.create_index("ix_orders_seller_id", "orders", ["seller_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_orders_seller_id", table_name="orders")
    op.drop_index("ix_orders_buyer_id", table_name="orders")
    op.drop_table("orders")
