import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.sqlite_dal import Base, QuizTopic, EssayQATopic
from backend.database.db import get_db

# Get the absolute path of the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "quiz_database.db")

print(f"Attempting to connect to SQLite database at: {db_path}")

try:
    # Direct SQLite connection test
    sqlite_conn = sqlite3.connect(db_path)
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in the database:", tables)
    
    # Test specific tables
    print("\nChecking EssayQA tables...")
    cursor.execute("SELECT COUNT(*) FROM Essay_qa_topics;")
    topic_count = cursor.fetchone()[0]
    print(f"Number of EssayQA topics: {topic_count}")
    
    if topic_count > 0:
        cursor.execute("SELECT id, topic, category, subcategory FROM Essay_qa_topics LIMIT 5;")
        sample_topics = cursor.fetchall()
        print("Sample topics:")
        for topic in sample_topics:
            print(topic)
    
    sqlite_conn.close()
    print("\nDirect SQLite connection successful!")
    
    # SQLAlchemy connection test
    engine = create_engine(f"sqlite:///{db_path}")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Test querying with SQLAlchemy
    Essay_topics = db.query(EssayQATopic).all()
    print(f"\nFound {len(Essay_topics)} EssayQA topics using SQLAlchemy")
    
    db.close()
    print("SQLAlchemy connection successful!")

except Exception as e:
    print(f"Error connecting to database: {e}")

# test the get_db function
print("\nTesting get_db function...")
try:
    db_session = next(get_db())
    print("get_db function works!")
    db_session.close()
except Exception as e:
    print(f"Error with get_db function: {e}") 