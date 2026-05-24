"""baseline current schema

Revision ID: 6668ddc7b710
Revises: 
Create Date: 2026-05-24 11:08:18.929128

"""

from typing import Sequence
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "6668ddc7b710"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "auctions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("video_url", sa.String(), nullable=True),
        sa.Column("starting_bid", sa.Numeric(12, 2), nullable=True),
        sa.Column("increment_value", sa.Numeric(12, 2), nullable=False),
        sa.Column("buy_out_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("base_duration", sa.Integer(), nullable=True),
        sa.Column("scheduled_time_to_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_extended_duration", sa.Boolean(), nullable=True),
        sa.Column("trigger_seconds", sa.Integer(), nullable=True),
        sa.Column("seconds_extended", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["seller_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "bids",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("auction_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["auction_id"],
            ["auctions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["buyer_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("bids")
    op.drop_table("auctions")
    op.drop_table("users")