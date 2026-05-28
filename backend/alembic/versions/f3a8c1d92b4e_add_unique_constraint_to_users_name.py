"""add unique constraint to users name

Revision ID: f3a8c1d92b4e
Revises: 6668ddc7b710
Create Date: 2026-05-24 22:20:00.000000

"""

from typing import Sequence
from typing import Union

from alembic import op


revision: str = "f3a8c1d92b4e"
down_revision: Union[str, None] = "6668ddc7b710"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        WITH duplicate_users AS (
            SELECT
                id,
                name,
                row_number() OVER (PARTITION BY name ORDER BY id) AS duplicate_number
            FROM users
        )
        UPDATE users
        SET name = users.name || '_' || substring(users.id::text, 1, 8)
        FROM duplicate_users
        WHERE users.id = duplicate_users.id
          AND duplicate_users.duplicate_number > 1
        """
    )
    op.create_unique_constraint("uq_users_name", "users", ["name"])


def downgrade() -> None:
    op.drop_constraint("uq_users_name", "users", type_="unique")
