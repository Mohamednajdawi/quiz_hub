"""
Migration script to add content_id columns to reference tables
"""
import sqlite3
import os

def migrate():
    # Get the database path
    db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'quiz_app.db')
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add content_id column to quiz references table
        cursor.execute("""
            ALTER TABLE student_project_quiz_references 
            ADD COLUMN content_id INTEGER REFERENCES student_project_contents(id)
        """)
        
        # Add content_id column to flashcard references table
        cursor.execute("""
            ALTER TABLE student_project_flashcard_references 
            ADD COLUMN content_id INTEGER REFERENCES student_project_contents(id)
        """)
        
        # Add content_id column to essay references table
        cursor.execute("""
            ALTER TABLE student_project_essay_references 
            ADD COLUMN content_id INTEGER REFERENCES student_project_contents(id)
        """)
        
        # Commit the changes
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate() 