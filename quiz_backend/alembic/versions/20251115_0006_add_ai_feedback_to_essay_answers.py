"""add ai_feedback to essay_answers (reverted - no-op migration)

Revision ID: 20251115_0006_add_ai_feedback_to_essay_answers
Revises: 20251113_0005
Create Date: 2025-11-15 00:06:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251115_0006_add_ai_feedback_to_essay_answers"
down_revision: Union[str, None] = "20251113_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This migration was reverted - no changes needed
    # The database may already have this column, but we're not managing it anymore
    pass


def downgrade() -> None:
    # This migration was reverted - no changes needed
    pass

