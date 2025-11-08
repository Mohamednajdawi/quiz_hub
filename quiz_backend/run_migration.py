#!/usr/bin/env python3
"""Utility to run Alembic migrations programmatically."""

from __future__ import annotations

import os
import sys

try:
    from alembic import command
    from alembic.config import Config
except ImportError:
    print("❌ Alembic not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "alembic>=1.13.3"])
    from alembic import command
    from alembic.config import Config


def get_config() -> Config:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    alembic_ini = os.path.join(base_dir, "alembic.ini")
    if not os.path.exists(alembic_ini):
        raise FileNotFoundError("alembic.ini not found; ensure Alembic is initialised")

    config = Config(alembic_ini)
    config.set_main_option("script_location", os.path.join(base_dir, "alembic"))
    return config


def main() -> None:
    try:
        config = get_config()
        print("🚀 Running Alembic migrations -> head")
        command.upgrade(config, "head")
        print("✅ Database is up to date")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()