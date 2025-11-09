"""Add share code fields to quizzes

Revision ID: 20251108_0001
Revises: 20251107_0004
Create Date: 2025-11-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251108_0001"
down_revision: Union[str, None] = "20251107_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Add share code and created_by_user_id to quiz_topics table
    if "quiz_topics" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("quiz_topics")}
        
        if "created_by_user_id" not in columns:
            op.execute(sa.text("ALTER TABLE quiz_topics ADD COLUMN created_by_user_id VARCHAR(255)"))
            # Add foreign key constraint if possible
            try:
                op.create_foreign_key(
                    "fk_quiz_topics_created_by",
                    "quiz_topics",
                    "users",
                    ["created_by_user_id"],
                    ["id"],
                    ondelete="SET NULL"
                )
            except Exception:
                # Foreign key might already exist or SQLite might not support it
                pass
        
        if "share_code" not in columns:
            op.execute(sa.text("ALTER TABLE quiz_topics ADD COLUMN share_code VARCHAR(6)"))
            # Create unique index for share_code
            try:
                op.create_index("ix_quiz_topics_share_code", "quiz_topics", ["share_code"], unique=True)
            except Exception:
                # Index might already exist
                pass
    
    # Add shared quiz fields to quiz_attempts table
    if "quiz_attempts" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("quiz_attempts")}
        
        if "is_shared_quiz" not in columns:
            op.execute(sa.text("ALTER TABLE quiz_attempts ADD COLUMN is_shared_quiz BOOLEAN DEFAULT 0"))
        
        if "participant_name" not in columns:
            op.execute(sa.text("ALTER TABLE quiz_attempts ADD COLUMN participant_name VARCHAR(255)"))
        
        if "share_code" not in columns:
            op.execute(sa.text("ALTER TABLE quiz_attempts ADD COLUMN share_code VARCHAR(6)"))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Remove shared quiz fields from quiz_attempts table
    if "quiz_attempts" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("quiz_attempts")}
        
        if "share_code" in columns:
            with op.batch_alter_table("quiz_attempts") as batch_op:
                batch_op.drop_column("share_code")
        
        if "participant_name" in columns:
            with op.batch_alter_table("quiz_attempts") as batch_op:
                batch_op.drop_column("participant_name")
        
        if "is_shared_quiz" in columns:
            with op.batch_alter_table("quiz_attempts") as batch_op:
                batch_op.drop_column("is_shared_quiz")
    
    # Remove share code and created_by_user_id from quiz_topics table
    if "quiz_topics" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("quiz_topics")}
        
        # Drop index first
        try:
            op.drop_index("ix_quiz_topics_share_code", table_name="quiz_topics")
        except Exception:
            pass
        
        if "share_code" in columns:
            with op.batch_alter_table("quiz_topics") as batch_op:
                batch_op.drop_column("share_code")
        
        # Drop foreign key constraint
        try:
            op.drop_constraint("fk_quiz_topics_created_by", "quiz_topics", type_="foreignkey")
        except Exception:
            pass
        
        if "created_by_user_id" in columns:
            with op.batch_alter_table("quiz_topics") as batch_op:
                batch_op.drop_column("created_by_user_id")

