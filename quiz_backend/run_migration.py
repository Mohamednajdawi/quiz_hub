#!/usr/bin/env python3
"""
Simple script to run the database migration on Heroku
"""

import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from update_db import update_database, test_database_connection

def main():
    print("🚀 Running database migration on Heroku...")
    
    # Test connection first
    if not test_database_connection():
        print("❌ Cannot proceed without database connection")
        sys.exit(1)
    
    # Run the migration
    if update_database():
        print("✅ Database migration completed successfully!")
        sys.exit(0)
    else:
        print("❌ Database migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 