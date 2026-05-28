"""add auction status check

Revision ID: 9c0c01d4b8a2
Revises: f3a8c1d92b4e
Create Date: 2026-05-27 10:35:00.000000

"""

from typing import Sequence
from typing import Union

from alembic import op


revision: str = "9c0c01d4b8a2"
down_revision: Union[str, None] = "f3a8c1d92b4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


VALID_STATUSES = ("not_started", "on_going", "completed", "cancelled")
VALID_STATUSES_SQL = "', '".join(VALID_STATUSES)


def upgrade() -> None:
    op.execute(
        f"""
        UPDATE auctions
        SET status = 'not_started'
        WHERE status IS NULL
           OR status NOT IN ('{VALID_STATUSES_SQL}')
        """
    )
    op.alter_column("auctions", "status", nullable=False)
    op.create_check_constraint(
        "ck_auctions_status",
        "auctions",
        f"status IN ('{VALID_STATUSES_SQL}')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_auctions_status", "auctions", type_="check")
    op.alter_column("auctions", "status", nullable=True)
