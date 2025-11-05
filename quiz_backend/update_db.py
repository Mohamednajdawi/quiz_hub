#!/usr/bin/env python3
"""
Database update script for Heroku deployment
Updates the database schema to include detailed quiz attempts with results
"""

import os
import sys
from sqlalchemy import text, inspect

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database.db import engine, SessionLocal
from backend.database.sqlite_dal import Base

def update_database():
    """Update the database schema"""
    try:
        print("🔄 Starting database update...")
        
        # Create a session
        db = SessionLocal()
        
        # Get the inspector
        inspector = inspect(engine)
        
        # Check if the quiz_attempts table exists
        existing_tables = inspector.get_table_names()
        print(f"📋 Existing tables: {existing_tables}")
        
        # Add content_id columns to reference tables
        print("🔄 Adding content_id columns to reference tables...")
        reference_tables = [
            'student_project_quiz_references',
            'student_project_flashcard_references', 
            'student_project_essay_references'
        ]
        
        for table_name in reference_tables:
            if table_name in existing_tables:
                print(f"📋 Checking table: {table_name}")
                existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
                print(f"📋 Existing columns in {table_name}: {existing_columns}")
                
                if 'content_id' not in existing_columns:
                    print(f"➕ Adding content_id column to {table_name}")
                    try:
                        db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN content_id INTEGER REFERENCES student_project_contents(id)"))
                        db.commit()
                        print(f"✅ Added content_id column to {table_name}")
                    except Exception as e:
                        print(f"⚠️ Error adding content_id to {table_name}: {e}")
                        db.rollback()
                else:
                    print(f"✅ content_id column already exists in {table_name}")
            else:
                print(f"⚠️ Table {table_name} doesn't exist yet")
        
        # Add difficulty columns to topic tables
        print("🔄 Adding difficulty columns to topic tables...")
        topic_tables = [
            'quiz_topics',
            'flashcard_topics', 
            'Essay_qa_topics'
        ]
        
        for table_name in topic_tables:
            if table_name in existing_tables:
                print(f"📋 Checking table: {table_name}")
                existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
                print(f"📋 Existing columns in {table_name}: {existing_columns}")
                
                if 'difficulty' not in existing_columns:
                    print(f"➕ Adding difficulty column to {table_name}")
                    try:
                        # Use quoted table name for PostgreSQL case sensitivity
                        db.execute(text(f'ALTER TABLE "{table_name}" ADD COLUMN difficulty VARCHAR'))
                        db.commit()
                        print(f"✅ Added difficulty column to {table_name}")
                    except Exception as e:
                        print(f"⚠️ Error adding difficulty to {table_name}: {e}")
                        db.rollback()
                else:
                    print(f"✅ difficulty column already exists in {table_name}")
            else:
                print(f"⚠️ Table {table_name} doesn't exist yet")
        
        if 'quiz_attempts' in existing_tables:
            print("📊 Quiz attempts table exists, checking for new columns...")
            
            # Get existing columns
            existing_columns = [col['name'] for col in inspector.get_columns('quiz_attempts')]
            print(f"📋 Existing columns in quiz_attempts: {existing_columns}")
            
            # Define new columns to add
            new_columns = [
                ('user_id', 'INTEGER'),
                ('score', 'INTEGER'),
                ('total_questions', 'INTEGER'),
                ('time_taken_seconds', 'INTEGER'),
                ('percentage_score', 'FLOAT'),
                ('user_answers', 'JSON'),
                ('correct_answers', 'JSON'),
                ('question_performance', 'JSON'),
                ('difficulty_level', 'VARCHAR'),
                ('source_type', 'VARCHAR'),
                ('source_info', 'VARCHAR')
            ]
            
            # Add missing columns
            for column_name, column_type in new_columns:
                if column_name not in existing_columns:
                    print(f"➕ Adding column: {column_name}")
                    try:
                        if column_type == 'JSON':
                            # For JSON columns, we'll use TEXT initially
                            db.execute(text(f"ALTER TABLE quiz_attempts ADD COLUMN {column_name} TEXT"))
                        else:
                            db.execute(text(f"ALTER TABLE quiz_attempts ADD COLUMN {column_name} {column_type}"))
                        db.commit()
                        print(f"✅ Added column: {column_name}")
                    except Exception as e:
                        print(f"⚠️ Column {column_name} might already exist or error occurred: {e}")
                        db.rollback()
                else:
                    print(f"✅ Column {column_name} already exists")
            
            # Update existing records to have default values
            print("🔄 Updating existing records with default values...")
            try:
                # Set default values for existing records
                db.execute(text("""
                    UPDATE quiz_attempts 
                    SET score = 0,
                        total_questions = 1,
                        time_taken_seconds = 0,
                        percentage_score = 0.0,
                        user_answers = '[]',
                        correct_answers = '[]',
                        user_id = NULL
                    WHERE score IS NULL
                """))
                db.commit()
                print("✅ Updated existing records with default values")
            except Exception as e:
                print(f"⚠️ Error updating existing records: {e}")
                db.rollback()
        
        else:
            print("📊 Quiz attempts table doesn't exist, creating all tables...")
            # Create all tables (this will create the new schema)
            Base.metadata.create_all(engine)
            print("✅ All tables created successfully")
        
        # Check if essay_answers table exists
        if 'essay_answers' not in existing_tables:
            print("📊 Creating essay_answers table...")
            try:
                db.execute(text("""
                    CREATE TABLE essay_answers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        essay_topic_id INTEGER NOT NULL,
                        user_id VARCHAR NOT NULL,
                        question_index INTEGER NOT NULL,
                        user_answer TEXT NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (essay_topic_id) REFERENCES Essay_qa_topics(id),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                """))
                db.commit()
                print("✅ essay_answers table created successfully")
            except Exception as e:
                print(f"⚠️ Error creating essay_answers table: {e}")
                db.rollback()
        else:
            print("✅ essay_answers table already exists")
        
        # Verify the update
        print("🔍 Verifying database schema...")
        inspector = inspect(engine)
        updated_columns = [col['name'] for col in inspector.get_columns('quiz_attempts')]
        print(f"📋 Updated columns in quiz_attempts: {updated_columns}")
        
        # Check if all required columns are present
        required_columns = [
            'id', 'user_id', 'topic_id', 'timestamp', 'score', 'total_questions',
            'time_taken_seconds', 'percentage_score', 'user_answers', 'correct_answers',
            'question_performance', 'difficulty_level', 'source_type', 'source_info'
        ]
        
        missing_columns = [col for col in required_columns if col not in updated_columns]
        if missing_columns:
            print(f"❌ Missing columns: {missing_columns}")
            return False
        else:
            print("✅ All required columns are present")
        
        db.close()
        print("🎉 Database update completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error updating database: {e}")
        return False

def test_database_connection():
    """Test the database connection"""
    try:
        print("🔍 Testing database connection...")
        db = SessionLocal()
        
        # Test a simple query
        result = db.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def show_database_info():
    """Show information about the current database"""
    try:
        print("📊 Database Information:")
        print(f"Database URL: {os.environ.get('DATABASE_URL', 'Local SQLite')}")
        
        db = SessionLocal()
        inspector = inspect(engine)
        
        tables = inspector.get_table_names()
        print(f"Tables: {tables}")
        
        for table in tables:
            columns = inspector.get_columns(table)
            print(f"\n📋 Table '{table}' columns:")
            for col in columns:
                print(f"  - {col['name']}: {col['type']}")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error getting database info: {e}")

if __name__ == "__main__":
    print("🚀 Starting database update process...")
    
    # Test connection first
    if not test_database_connection():
        print("❌ Cannot proceed without database connection")
        sys.exit(1)
    
    # Show current database info
    show_database_info()
    
    # Update the database
    if update_database():
        print("✅ Database update completed successfully!")
        
        # Show updated database info
        print("\n📊 Updated Database Information:")
        show_database_info()
    else:
        print("❌ Database update failed!")
        sys.exit(1) 