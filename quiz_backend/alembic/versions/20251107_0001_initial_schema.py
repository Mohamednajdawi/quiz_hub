"""Initial schema managed by Alembic

Revision ID: 20251107_0001
Revises: 
Create Date: 2025-11-07
"""

from typing import Sequence, Union

from alembic import op

from sqlalchemy.engine import Connection

# revision identifiers, used by Alembic.
revision: str = "20251107_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from backend.database.sqlite_dal import Base  # local import for Alembic

    bind: Connection = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    from backend.database.sqlite_dal import Base  # local import for Alembic

    bind: Connection = op.get_bind()
    Base.metadata.drop_all(bind=bind)

