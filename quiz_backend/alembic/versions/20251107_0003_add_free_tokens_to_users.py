"""Add free_tokens column to users

Revision ID: 20251107_0003
Revises: 20251107_0002
Create Date: 2025-11-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251107_0003"
down_revision: Union[str, None] = "20251107_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("users")}

    if "free_tokens" not in columns:
        with op.batch_alter_table("users") as batch_op:
            batch_op.add_column(sa.Column("free_tokens", sa.Integer(), nullable=True))
        op.execute(sa.text("UPDATE users SET free_tokens = 10 WHERE free_tokens IS NULL"))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("users")}

    if "free_tokens" in columns:
        with op.batch_alter_table("users") as batch_op:
            batch_op.drop_column("free_tokens")

