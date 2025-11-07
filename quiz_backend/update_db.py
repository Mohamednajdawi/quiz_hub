#!/usr/bin/env python3
"""Compatibility wrapper that now proxies to Alembic migrations."""

from __future__ import annotations

import os
import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect


def _get_config() -> Config:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    alembic_ini = os.path.join(base_dir, "alembic.ini")
    if not os.path.exists(alembic_ini):
        raise FileNotFoundError("alembic.ini not found; make sure alembic is initialised")

    config = Config(alembic_ini)
    config.set_main_option("script_location", os.path.join(base_dir, "alembic"))
    return config


def update_database() -> bool:
    config = _get_config()
    command.upgrade(config, "head")
    return True


def test_database_connection() -> bool:
    try:
        from backend.database.db import SessionLocal  # noqa: WPS433
        session = SessionLocal()
        session.execute("SELECT 1")
        session.close()
        return True
    except Exception:  # pragma: no cover - simple smoke test
        return False


def show_database_info() -> None:
    from backend.database.db import get_engine  # noqa: WPS433

    engine = get_engine()
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables:", tables)


if __name__ == "__main__":
    if not test_database_connection():
        print("❌ Cannot proceed without database connection")
        sys.exit(1)

    update_database()
    print("✅ Database migration completed successfully")