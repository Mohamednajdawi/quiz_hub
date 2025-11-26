"""Ensure mind_maps table has expected columns

Revision ID: 20251126_0009_fix_mind_maps_columns
Revises: 20251126_0008_add_mind_map_tables
Create Date: 2025-11-26 00:09:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251126_0009_fix_mind_maps_columns"
down_revision: Union[str, None] = "20251126_0008_add_mind_map_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _column_names(inspector, table_name: str) -> set[str]:
    return {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _table_exists(inspector, "mind_maps"):
        # Nothing to fix if the table does not exist
        return

    existing = _column_names(inspector, "mind_maps")

    def add_if_missing(name: str, column: sa.Column) -> None:
        if name not in existing:
            op.add_column("mind_maps", column)

    # Align the physical schema with the ORM model.
    add_if_missing("user_id", sa.Column("user_id", sa.String(length=255), nullable=True))
    add_if_missing("project_id", sa.Column("project_id", sa.Integer(), nullable=True))
    add_if_missing("content_id", sa.Column("content_id", sa.Integer(), nullable=True))
    add_if_missing("title", sa.Column("title", sa.String(), nullable=True))
    add_if_missing("category", sa.Column("category", sa.String(), nullable=True))
    add_if_missing("subcategory", sa.Column("subcategory", sa.String(), nullable=True))
    add_if_missing("central_idea", sa.Column("central_idea", sa.String(), nullable=True))
    add_if_missing("summary", sa.Column("summary", sa.Text(), nullable=True))
    add_if_missing("key_concepts", sa.Column("key_concepts", sa.JSON(), nullable=True))
    add_if_missing("nodes", sa.Column("nodes", sa.JSON(), nullable=True))
    add_if_missing("edges", sa.Column("edges", sa.JSON(), nullable=True))
    add_if_missing("connections", sa.Column("connections", sa.JSON(), nullable=True))
    add_if_missing("callouts", sa.Column("callouts", sa.JSON(), nullable=True))
    add_if_missing("recommended_next_steps", sa.Column("recommended_next_steps", sa.JSON(), nullable=True))
    add_if_missing("metadata", sa.Column("metadata", sa.JSON(), nullable=True))
    add_if_missing("created_at", sa.Column("created_at", sa.DateTime(), nullable=True))
    add_if_missing("updated_at", sa.Column("updated_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Best-effort downgrade: drop the columns we may have added.

    We guard each drop with an existence check so this stays safe on mixed schemas.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _table_exists(inspector, "mind_maps"):
        return

    existing = _column_names(inspector, "mind_maps")

    def drop_if_present(name: str) -> None:
        if name in existing:
            op.drop_column("mind_maps", name)

    for col_name in [
        "user_id",
        "project_id",
        "content_id",
        "title",
        "category",
        "subcategory",
        "central_idea",
        "summary",
        "key_concepts",
        "nodes",
        "edges",
        "connections",
        "callouts",
        "recommended_next_steps",
        "metadata",
        "created_at",
        "updated_at",
    ]:
        drop_if_present(col_name)


