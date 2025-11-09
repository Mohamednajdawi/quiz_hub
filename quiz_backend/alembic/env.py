import os
import sys

from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool
from sqlalchemy.engine import Connection

from alembic import context

# Ensure the backend package is importable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database.sqlite_dal import Base  # noqa: E402

# Interpret the config file for Python logging.
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_database_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        if env_url.startswith("postgres://"):
            env_url = env_url.replace("postgres://", "postgresql://", 1)
        return env_url

    # Use /app/data directory for Railway volume mounts, fallback to default location
    if os.path.exists("/app/data"):
        db_path = "/app/data/quiz_database.db"
    else:
        db_path = os.path.join(BACKEND_DIR, "database", "quiz_database.db")
    return f"sqlite:///{db_path}"


def run_migrations_offline() -> None:
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = get_database_url()
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

