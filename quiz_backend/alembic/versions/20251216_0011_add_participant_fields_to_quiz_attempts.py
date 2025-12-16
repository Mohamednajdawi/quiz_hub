"""Add participant fields to quiz_attempts

Revision ID: 20251216_0011
Revises: 20251127_0001
Create Date: 2025-12-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251216_0011"
down_revision: Union[str, None] = "20251127_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new participant fields to quiz_attempts table
    op.add_column('quiz_attempts', sa.Column('participant_first_name', sa.String(), nullable=True))
    op.add_column('quiz_attempts', sa.Column('participant_last_name', sa.String(), nullable=True))
    op.add_column('quiz_attempts', sa.Column('participant_email', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove the columns if rolling back
    op.drop_column('quiz_attempts', 'participant_email')
    op.drop_column('quiz_attempts', 'participant_last_name')
    op.drop_column('quiz_attempts', 'participant_first_name')

