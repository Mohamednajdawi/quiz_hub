"""Add token tracking to generation_jobs and create token_usage table

Revision ID: 20251127_0001
Revises: 20251126_0010_relax_mind_maps_topic_not_null
Create Date: 2025-11-27 00:01:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251127_0001"
down_revision: Union[str, None] = "20251126_0010_relax_mind_maps_topic_not_null"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add token tracking columns to generation_jobs table
    with op.batch_alter_table("generation_jobs", schema=None) as batch_op:
        batch_op.add_column(sa.Column("input_tokens", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("output_tokens", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("total_tokens", sa.Integer(), nullable=True))
    
    # Create token_usage table for tracking all token usage (direct generations)
    op.create_table(
        "token_usage",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=255), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("generation_type", sa.String(length=50), nullable=False),  # quiz, flashcard, essay_qa, mind_map
        sa.Column("topic_id", sa.Integer(), nullable=True),  # ID of the generated content (quiz_topic_id, flashcard_topic_id, etc.)
        sa.Column("input_tokens", sa.Integer(), nullable=False),
        sa.Column("output_tokens", sa.Integer(), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("token_usage")
    
    with op.batch_alter_table("generation_jobs", schema=None) as batch_op:
        batch_op.drop_column("total_tokens")
        batch_op.drop_column("output_tokens")
        batch_op.drop_column("input_tokens")

