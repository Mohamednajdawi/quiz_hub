import logging
import os
import sys
from pathlib import Path

from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool
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
        logging.info("[Alembic] Using DATABASE_URL from environment: %s", env_url)
        return env_url

    default_filename = "quiz_database.db"
    candidates = []

    env_sqlite_path = os.getenv("DATABASE_SQLITE_PATH")
    if env_sqlite_path:
        candidates.append(Path(env_sqlite_path))

    railway_dir = Path("/app/data")
    if railway_dir.is_dir():
        candidates.append(railway_dir / default_filename)

    candidates.append(Path(BACKEND_DIR) / "database" / default_filename)

    for candidate in candidates:
        try:
            candidate.parent.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            logging.warning("[Alembic] Permission denied creating directory for %s", candidate)
            continue
        except OSError as exc:
            logging.warning("[Alembic] Unable to create directory for %s: %s", candidate, exc)
            continue
        if os.access(candidate.parent, os.W_OK):
            logging.info("[Alembic] Using SQLite database at %s", candidate)
            return f"sqlite:///{candidate}"
        logging.warning("[Alembic] Directory %s is not writable", candidate.parent)

    raise RuntimeError(
        "Alembic could not locate a writable SQLite database path. "
        "Set DATABASE_URL or DATABASE_SQLITE_PATH to a writable path."
    )


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

