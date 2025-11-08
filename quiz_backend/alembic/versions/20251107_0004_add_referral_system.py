"""Add referral system columns and table

Revision ID: 20251107_0004
Revises: 20251107_0003
Create Date: 2025-11-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251107_0004"
down_revision: Union[str, None] = "20251107_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Add referral columns to users table
    if "users" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("users")}
        
        if "referral_code" not in columns:
            # Use direct ALTER TABLE for SQLite compatibility
            op.execute(sa.text("ALTER TABLE users ADD COLUMN referral_code VARCHAR(20)"))
        
        if "referred_by_code" not in columns:
            # Use direct ALTER TABLE for SQLite compatibility
            op.execute(sa.text("ALTER TABLE users ADD COLUMN referred_by_code VARCHAR(20)"))
    
    # Create referrals table
    if "referrals" not in inspector.get_table_names():
        op.create_table(
            "referrals",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("referrer_id", sa.String(255), nullable=False),
            sa.Column("referred_id", sa.String(255), nullable=False),
            sa.Column("referral_code", sa.String(20), nullable=False),
            sa.Column("bonus_tokens_awarded", sa.Integer(), nullable=True, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["referrer_id"], ["users.id"], ),
            sa.ForeignKeyConstraint(["referred_id"], ["users.id"], ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("referred_id")
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Drop referrals table
    if "referrals" in inspector.get_table_names():
        op.drop_table("referrals")
    
    # Remove referral columns from users table
    if "users" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("users")}
        
        if "referred_by_code" in columns:
            with op.batch_alter_table("users") as batch_op:
                batch_op.drop_column("referred_by_code")
        
        if "referral_code" in columns:
            with op.batch_alter_table("users") as batch_op:
                batch_op.drop_column("referral_code")

