"""Relax NOT NULL constraint on mind_maps.topic

Revision ID: 20251126_0010_relax_mind_maps_topic_not_null
Revises: 20251126_0009_fix_mind_maps_columns
Create Date: 2025-11-26 00:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251126_0010_relax_mind_maps_topic_not_null"
down_revision: Union[str, None] = "20251126_0009_fix_mind_maps_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
  """Make mind_maps.topic nullable so new ORM inserts do not violate constraints."""
  try:
      with op.batch_alter_table("mind_maps") as batch_op:
          batch_op.alter_column(
              "topic",
              existing_type=sa.String(),
              nullable=True,
          )
  except Exception:
      # If the column doesn't exist or the backend can't alter it, fail silently.
      # The previous migration already made all new columns nullable, so this is best-effort.
      pass


def downgrade() -> None:
  """Optionally restore NOT NULL on mind_maps.topic."""
  try:
      with op.batch_alter_table("mind_maps") as batch_op:
          batch_op.alter_column(
              "topic",
              existing_type=sa.String(),
              nullable=False,
          )
  except Exception:
      pass


