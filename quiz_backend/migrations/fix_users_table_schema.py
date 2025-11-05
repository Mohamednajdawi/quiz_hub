"""
Migration script to fix users table schema
Changes id from INTEGER to VARCHAR to support UUID strings
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
    # Check current schema
    result = db.execute(text("PRAGMA table_info(users)"))
    columns = result.fetchall()
    print("Current users table schema:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
    # Check if id is INTEGER
    id_col = next((col for col in columns if col[1] == 'id'), None)
    if id_col and id_col[2] == 'INTEGER':
        print("\n⚠️  id column is INTEGER but needs to be VARCHAR for UUID strings")
        print("Creating new users table with correct schema...")
        
        # Create new table with correct schema
        db.execute(text("""
            CREATE TABLE users_new (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                firebase_uid VARCHAR(255) UNIQUE,
                stripe_customer_id VARCHAR(255) UNIQUE,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME,
                updated_at DATETIME
            )
        """))
        
        # Copy data if any exists (convert INTEGER id to string)
        db.execute(text("""
            INSERT INTO users_new (id, email, password_hash, firebase_uid, stripe_customer_id, is_active, created_at, updated_at)
            SELECT 
                CAST(id AS TEXT) as id,
                email,
                password_hash,
                firebase_uid,
                stripe_customer_id,
                is_active,
                created_at,
                updated_at
            FROM users
        """))
        
        # Drop old table
        db.execute(text("DROP TABLE users"))
        
        # Rename new table
        db.execute(text("ALTER TABLE users_new RENAME TO users"))
        
        db.commit()
        print("✓ Successfully migrated users table schema")
    else:
        print("\n✓ id column is already VARCHAR or TEXT")
    
    # Verify the change
    result = db.execute(text("PRAGMA table_info(users)"))
    columns = result.fetchall()
    print("\nUpdated users table schema:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
except Exception as e:
    db.rollback()
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

