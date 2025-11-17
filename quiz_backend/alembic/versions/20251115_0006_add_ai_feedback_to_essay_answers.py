"""add ai_feedback and score to essay_answers

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
    # Add ai_feedback and score columns to essay_answers table
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if "essay_answers" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("essay_answers")}
        
        if "ai_feedback" not in columns:
            op.add_column("essay_answers", sa.Column("ai_feedback", sa.Text(), nullable=True))
        
        if "score" not in columns:
            op.add_column("essay_answers", sa.Column("score", sa.Float(), nullable=True))


def downgrade() -> None:
    # Remove ai_feedback and score columns from essay_answers table
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if "essay_answers" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("essay_answers")}
        
        if "score" in columns:
            op.drop_column("essay_answers", "score")
        
        if "ai_feedback" in columns:
            op.drop_column("essay_answers", "ai_feedback")

