"""Add generation_jobs table

Revision ID: 20251113_0005
Revises: 20251107_0004_add_referral_system
Create Date: 2025-11-13 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251113_0005"
down_revision: Union[str, None] = "20251107_0004_add_referral_system"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "generation_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=255), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("student_projects.id"), nullable=False),
        sa.Column("content_id", sa.Integer(), sa.ForeignKey("student_project_contents.id"), nullable=True),
        sa.Column("job_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("result_topic_id", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("generation_jobs")

