"""add ai_feedback column to quiz_attempts

Revision ID: 20251111_0002_add_ai_feedback_to_quiz_attempts
Revises: 20251108_0001_add_share_code_to_quizzes
Create Date: 2025-11-11 00:02:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251111_0002_add_ai_feedback_to_quiz_attempts"
down_revision = "20251108_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("quiz_attempts", sa.Column("ai_feedback", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("quiz_attempts", "ai_feedback")

