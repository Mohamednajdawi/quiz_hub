import logging
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def _build_database_url() -> str:
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        logging.info("[DB] Using DATABASE_URL from environment: %s", database_url)
        return database_url

    # Determine SQLite database location
    default_filename = "quiz_database.db"

    def _ensure_parent(path: Path) -> bool:
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            logging.warning("[DB] Permission denied creating directory for %s", path)
            return False
        except OSError as exc:
            logging.warning("[DB] Unable to create directory for %s: %s", path, exc)
            return False
        if os.access(path.parent, os.W_OK):
            return True
        logging.warning("[DB] Directory %s is not writable", path.parent)
        return False

    candidates = []

    env_sqlite_path = os.getenv("DATABASE_SQLITE_PATH")
    if env_sqlite_path:
        candidates.append(Path(env_sqlite_path))

    railway_dir = Path("/app/data")
    if railway_dir.is_dir():
        candidates.append(railway_dir / default_filename)

    candidates.append(Path(default_filename).absolute())

    for candidate in candidates:
        if _ensure_parent(candidate):
            sqlite_url = f"sqlite:///{candidate}"
            logging.info("[DB] Using SQLite database at %s", candidate)
            return sqlite_url

    raise RuntimeError(
        "Unable to determine writable location for SQLite database. "
        "Set DATABASE_URL or DATABASE_SQLITE_PATH to a writable path."
    )


engine = create_engine(
    _build_database_url(),
    connect_args={"check_same_thread": False} if os.getenv("DATABASE_URL") is None else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_engine():
    return engine


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
