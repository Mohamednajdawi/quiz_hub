"""Add created_by_user_id to flashcard and essay topics

Revision ID: 20251107_0002
Revises: 20251107_0001
Create Date: 2025-11-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251107_0002"
down_revision: Union[str, None] = "20251107_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())

    flashcard_columns = {col["name"] for col in inspector.get_columns("flashcard_topics")}
    if "created_by_user_id" not in flashcard_columns:
        with op.batch_alter_table("flashcard_topics") as batch_op:
            batch_op.add_column(sa.Column("created_by_user_id", sa.String(length=255), nullable=True))

    essay_columns = {col["name"] for col in inspector.get_columns("Essay_qa_topics")}
    if "created_by_user_id" not in essay_columns:
        with op.batch_alter_table("Essay_qa_topics") as batch_op:
            batch_op.add_column(sa.Column("created_by_user_id", sa.String(length=255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("flashcard_topics") as batch_op:
        batch_op.drop_column("created_by_user_id")

    with op.batch_alter_table("Essay_qa_topics") as batch_op:
        batch_op.drop_column("created_by_user_id")

