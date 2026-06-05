"""add auction started ended at

Revision ID: c4a1d9e8f2b0
Revises: b7d8e2f4a913
Create Date: 2026-05-29 00:00:00.000000

"""

from typing import Sequence
from typing import Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4a1d9e8f2b0"
down_revision: Union[str, None] = "b7d8e2f4a913"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "auctions",
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "auctions",
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("auctions", "ended_at")
    op.drop_column("auctions", "started_at")
