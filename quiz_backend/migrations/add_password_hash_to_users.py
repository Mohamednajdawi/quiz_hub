"""
Migration script to add password_hash column to users table
Run this script to update existing database schema
"""
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Get database path
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "quiz_database.db"))
print(f"Database path: {db_path}")

# Create engine
engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})

# Create session
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Check if column already exists
    result = db.execute(text("PRAGMA table_info(users)"))
    columns = [row[1] for row in result.fetchall()]
    
    if "password_hash" not in columns:
        print("Adding password_hash column to users table...")
        db.execute(text("ALTER TABLE users ADD COLUMN password_hash TEXT"))
        db.commit()
        print("✓ Successfully added password_hash column")
    else:
        print("✓ password_hash column already exists")
    
    # Verify the change
    result = db.execute(text("PRAGMA table_info(users)"))
    columns = [row[1] for row in result.fetchall()]
    print(f"Current columns in users table: {', '.join(columns)}")
    
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()

