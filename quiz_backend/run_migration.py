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


def verify_and_repair_schema() -> None:
    """Verify that required columns exist and add them if missing."""
    try:
        from sqlalchemy import create_engine, inspect, text
        from urllib.parse import urlparse
        
        database_url = os.environ.get("DATABASE_URL", "")
        if not database_url:
            print("⚠️  DATABASE_URL not set, skipping schema verification")
            return
        
        # Handle SQLite URL parsing
        if database_url.startswith("sqlite"):
            parsed = urlparse(database_url)
            if parsed.netloc and parsed.netloc != "":
                db_path = f"{parsed.netloc}{parsed.path}"
            else:
                db_path = parsed.path
            
            # Normalize double slashes
            if db_path.startswith("//"):
                db_path = db_path[1:]
            
            if not db_path.startswith("/"):
                db_path = os.path.abspath(db_path)
            
            # SQLite connection string
            engine = create_engine(f"sqlite:///{db_path}")
        else:
            engine = create_engine(database_url)
        
        inspector = inspect(engine)
        
        # Check if essay_answers table exists
        if "essay_answers" not in inspector.get_table_names():
            print("ℹ️  essay_answers table does not exist yet, skipping verification")
            return
        
        # Get existing columns
        columns = {col["name"] for col in inspector.get_columns("essay_answers")}
        
        # Check and add missing columns
        # SQLite DDL operations are autocommit, so we can execute them directly
        needs_repair = False
        with engine.connect() as conn:
            if "ai_feedback" not in columns:
                print("🔧 Adding missing column: essay_answers.ai_feedback")
                conn.execute(text("ALTER TABLE essay_answers ADD COLUMN ai_feedback TEXT"))
                conn.commit()
                print("✅ Added ai_feedback column")
                needs_repair = True
            
            if "score" not in columns:
                print("🔧 Adding missing column: essay_answers.score")
                conn.execute(text("ALTER TABLE essay_answers ADD COLUMN score REAL"))
                conn.commit()
                print("✅ Added score column")
                needs_repair = True
        
        if not needs_repair:
            print("✅ Schema verification passed: all required columns exist")
        
        engine.dispose()
    except Exception as e:
        print(f"⚠️  Schema verification/repair failed: {e}")
        import traceback
        traceback.print_exc()
        # Don't exit - migrations might have worked even if verification failed


def main() -> None:
    try:
        config = get_config()
        print("🚀 Running Alembic migrations -> head")
        command.upgrade(config, "head")
        print("✅ Database is up to date")
        
        # Verify and repair schema after migrations
        print("🔍 Verifying database schema...")
        verify_and_repair_schema()
    except Exception as e:
        import traceback
        print(f"❌ Migration failed: {e}")
        print("📋 Full traceback:")
        traceback.print_exc()
        print("\n💡 Tip: If migration fails, you can manually run it via Railway CLI:")
        print("   railway run python run_migration.py")
        
        # Try to repair schema even if migration failed
        print("\n🔧 Attempting to repair schema directly...")
        verify_and_repair_schema()
        
        sys.exit(1)


if __name__ == "__main__":
    main()