import os
import sys
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import from the backend package
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database.sqlite_dal import Base, User

# Get the absolute path of the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "quiz_database.db")
print(f"Database path: {db_path}")

# Create SQLite engine with absolute path
engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})

# Create all tables (this will create the new student project tables)
Base.metadata.create_all(engine)

print("Student project tables created successfully!")

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a session
db = SessionLocal()

try:
    # Check if we need to create any sample data or perform other migrations
    print("Database migration completed successfully!")
    
except Exception as e:
    db.rollback()
    print(f"Error during migration: {e}")
finally:
    db.close() 