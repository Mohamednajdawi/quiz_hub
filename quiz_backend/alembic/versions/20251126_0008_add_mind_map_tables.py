"""create mind map storage tables

Revision ID: 20251126_0008_add_mind_map_tables
Revises: 20251125_0007_add_mind_maps_table
Create Date: 2025-11-26 00:08:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251126_0008_add_mind_map_tables"
down_revision: Union[str, None] = "20251125_0007_add_mind_maps_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _table_exists(inspector, "mind_maps"):
        op.create_table(
            "mind_maps",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.String(length=255), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("project_id", sa.Integer(), sa.ForeignKey("student_projects.id"), nullable=False),
            sa.Column("content_id", sa.Integer(), sa.ForeignKey("student_project_contents.id"), nullable=True),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column("subcategory", sa.String(), nullable=True),
            sa.Column("central_idea", sa.String(), nullable=False),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("key_concepts", sa.JSON(), nullable=True),
            sa.Column("nodes", sa.JSON(), nullable=False),
            sa.Column("edges", sa.JSON(), nullable=True),
            sa.Column("connections", sa.JSON(), nullable=True),
            sa.Column("callouts", sa.JSON(), nullable=True),
            sa.Column("recommended_next_steps", sa.JSON(), nullable=True),
            sa.Column("metadata", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_mind_maps_project_id", "mind_maps", ["project_id"])
        op.create_index("ix_mind_maps_content_id", "mind_maps", ["content_id"])

    if not _table_exists(inspector, "student_project_mindmap_references"):
        op.create_table(
            "student_project_mindmap_references",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("project_id", sa.Integer(), sa.ForeignKey("student_projects.id"), nullable=False),
            sa.Column("content_id", sa.Integer(), sa.ForeignKey("student_project_contents.id"), nullable=True),
            sa.Column("mind_map_id", sa.Integer(), sa.ForeignKey("mind_maps.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index(
            "ix_student_project_mindmap_refs_project_id",
            "student_project_mindmap_references",
            ["project_id"],
        )
        op.create_index(
            "ix_student_project_mindmap_refs_content_id",
            "student_project_mindmap_references",
            ["content_id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, "student_project_mindmap_references"):
        op.drop_index("ix_student_project_mindmap_refs_project_id", table_name="student_project_mindmap_references")
        op.drop_index("ix_student_project_mindmap_refs_content_id", table_name="student_project_mindmap_references")
        op.drop_table("student_project_mindmap_references")

    if _table_exists(inspector, "mind_maps"):
        op.drop_index("ix_mind_maps_project_id", table_name="mind_maps")
        op.drop_index("ix_mind_maps_content_id", table_name="mind_maps")
        op.drop_table("mind_maps")

