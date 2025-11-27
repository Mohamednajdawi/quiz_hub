"""Placeholder revision to satisfy Alembic history after mind map rollback.

Revision ID: 20251125_0007_add_mind_maps_table
Revises: 20251115_0006_add_ai_feedback_to_essay_answers
Create Date: 2025-11-25 00:07:00.000000
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "20251125_0007_add_mind_maps_table"
down_revision: Union[str, None] = "20251115_0006_add_ai_feedback_to_essay_answers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Intentionally left blank; schema already handled in later revisions."""
    return None


def downgrade() -> None:
    """Intentionally left blank; schema already handled in later revisions."""
    return None


