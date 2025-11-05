#!/usr/bin/env python3
"""
Database initialization script for Heroku deployment
"""

import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database.sqlite_dal import Base
from backend.database.db import engine

def init_database():
    """Initialize the database with all tables"""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(engine)
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        return False

if __name__ == "__main__":
    init_database() 