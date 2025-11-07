import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from backend.database.sqlite_dal import Base

# Use environment variable for database URL if available, otherwise use the default path
database_url = os.environ.get("DATABASE_URL")
if database_url:
    print("Using remote database")
    # Handle Heroku PostgreSQL URL format
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    engine = create_engine(database_url)
else:
    print("Using local database")
    # Get the absolute path to the database file
    db_path = os.path.abspath("quiz_database.db")
    # Create SQLite engine with absolute path
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})

# Ensure new user profile columns exist (supports SQLite & Postgres)
def ensure_user_columns() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    required_columns = {
        "first_name": "VARCHAR(100)",
        "last_name": "VARCHAR(100)",
        "birth_date": "DATE",
        "gender": "VARCHAR(50)",
    }

    columns_to_add = {
        name: ddl for name, ddl in required_columns.items() if name not in existing_columns
    }

    if not columns_to_add:
        return

    with engine.begin() as connection:
        for column_name, column_def in columns_to_add.items():
            connection.execute(
                text(f"ALTER TABLE users ADD COLUMN {column_name} {column_def}")
            )


# Ensure tables and new columns exist
Base.metadata.create_all(engine)
ensure_user_columns()

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
