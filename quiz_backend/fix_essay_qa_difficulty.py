#!/usr/bin/env python3
"""
Script to add the difficulty column to Essay_qa_topics table in production
"""

import os
import sys
from sqlalchemy import text

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database.db import engine, SessionLocal

def add_difficulty_column():
    """Add difficulty column to Essay_qa_topics table"""
    try:
        print("🔄 Adding difficulty column to Essay_qa_topics table...")
        
        # Create a session
        db = SessionLocal()
        
        # Add the difficulty column using quoted table name
        db.execute(text('ALTER TABLE "Essay_qa_topics" ADD COLUMN difficulty VARCHAR'))
        db.commit()
        
        print("✅ Successfully added difficulty column to Essay_qa_topics")
        
        # Verify the column was added
        result = db.execute(text('''
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Essay_qa_topics' 
            AND column_name = 'difficulty'
        '''))
        
        if result.fetchone():
            print("✅ Verified: difficulty column exists in Essay_qa_topics")
            return True
        else:
            print("❌ Error: difficulty column not found after addition")
            return False
            
    except Exception as e:
        print(f"❌ Error adding difficulty column: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Running Essay QA difficulty column fix...")
    
    if add_difficulty_column():
        print("✅ Fix completed successfully!")
        sys.exit(0)
    else:
        print("❌ Fix failed!")
        sys.exit(1)