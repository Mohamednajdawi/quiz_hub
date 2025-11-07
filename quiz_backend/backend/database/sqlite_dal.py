import datetime

from sqlalchemy import JSON, Column, Date, DateTime, ForeignKey, Integer, String, Boolean, Float, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(255), primary_key=True)  # Firebase UID or generated UUID as primary key
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # For password-based auth
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String(50), nullable=True)
    firebase_uid = Column(String(255), unique=True, nullable=True)
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="user")
    payment_methods = relationship("PaymentMethod", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    student_projects = relationship("StudentProject", back_populates="user")
    flashcard_topics_created = relationship("FlashcardTopic", back_populates="created_by_user")
    essay_topics_created = relationship("EssayQATopic", back_populates="created_by_user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    stripe_subscription_id = Column(String, unique=True, nullable=False)
    plan_type = Column(String, nullable=False)  # basic, premium, enterprise
    status = Column(String, nullable=False)  # active, canceled, past_due, unpaid
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    stripe_payment_method_id = Column(String, unique=True, nullable=False)
    type = Column(String, nullable=False)  # card, bank_account
    last4 = Column(String, nullable=True)
    brand = Column(String, nullable=True)  # visa, mastercard, etc.
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    user = relationship("User", back_populates="payment_methods")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    stripe_payment_intent_id = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)  # Amount in cents
    currency = Column(String, default="usd")
    status = Column(String, nullable=False)  # succeeded, pending, failed
    description = Column(String, nullable=True)
    transaction_metadata = Column(JSON, nullable=True)  # Additional data (renamed from metadata)
    created_at = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    user = relationship("User", back_populates="transactions")


class QuizTopic(Base):
    __tablename__ = "quiz_topics"

    id = Column(Integer, primary_key=True)
    topic = Column(String, nullable=False)
    category = Column(String, nullable=False)
    subcategory = Column(String, nullable=False)
    difficulty = Column(String, nullable=True)  # easy, medium, hard
    creation_timestamp = Column(DateTime, default=datetime.datetime.now)
    questions = relationship("QuizQuestion", back_populates="topic")
    attempts = relationship("QuizAttempt", back_populates="topic")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True)
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=False)  # Store options as JSON
    right_option = Column(String, nullable=False)
    topic_id = Column(Integer, ForeignKey("quiz_topics.id"))

    topic = relationship("QuizTopic", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Firebase UID
    topic_id = Column(Integer, ForeignKey("quiz_topics.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Quiz results
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    time_taken_seconds = Column(Integer, nullable=False)  # Time taken in seconds
    percentage_score = Column(Float, nullable=False)  # Calculated percentage
    
    # User answers and performance data
    user_answers = Column(JSON, nullable=False)  # List of user's answer indices
    correct_answers = Column(JSON, nullable=False)  # List of correct answer indices
    question_performance = Column(JSON, nullable=True)  # Detailed per-question performance
    
    # Additional metadata
    difficulty_level = Column(String, nullable=True)  # easy, medium, hard
    source_type = Column(String, nullable=True)  # url, pdf, available
    source_info = Column(String, nullable=True)  # URL or filename
    
    # Relationships
    user = relationship("User", back_populates="quiz_attempts")
    topic = relationship("QuizTopic", back_populates="attempts")


class FlashcardTopic(Base):
    __tablename__ = "flashcard_topics"

    id = Column(Integer, primary_key=True)
    topic = Column(String, nullable=False)
    category = Column(String, nullable=False)
    subcategory = Column(String, nullable=False)
    difficulty = Column(String, nullable=True)  # easy, medium, hard
    creation_timestamp = Column(DateTime, default=datetime.datetime.now)
    created_by_user_id = Column(String(255), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    cards = relationship("FlashcardCard", back_populates="topic")
    created_by_user = relationship("User", back_populates="flashcard_topics_created")


class FlashcardCard(Base):
    __tablename__ = "flashcard_cards"

    id = Column(Integer, primary_key=True)
    front = Column(String, nullable=False)
    back = Column(String, nullable=False)
    importance = Column(String, nullable=True)  # high, medium, low
    topic_id = Column(Integer, ForeignKey("flashcard_topics.id"))

    topic = relationship("FlashcardTopic", back_populates="cards")


class EssayQATopic(Base):
    __tablename__ = "Essay_qa_topics"

    id = Column(Integer, primary_key=True)
    topic = Column(String, nullable=False)
    category = Column(String, nullable=False)
    subcategory = Column(String, nullable=False)
    difficulty = Column(String, nullable=True)  # easy, medium, hard
    creation_timestamp = Column(DateTime, default=datetime.datetime.now)
    created_by_user_id = Column(String(255), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    questions = relationship("EssayQAQuestion", back_populates="topic")
    created_by_user = relationship("User", back_populates="essay_topics_created")


class EssayQAQuestion(Base):
    __tablename__ = "Essay_qa_questions"

    id = Column(Integer, primary_key=True)
    question = Column(String, nullable=False)
    full_answer = Column(String, nullable=False)
    key_info = Column(JSON, nullable=False)  # Store key info points as JSON
    topic_id = Column(Integer, ForeignKey("Essay_qa_topics.id"))

    topic = relationship("EssayQATopic", back_populates="questions")


class EssayAnswer(Base):
    __tablename__ = "essay_answers"

    id = Column(Integer, primary_key=True)
    essay_topic_id = Column(Integer, ForeignKey("Essay_qa_topics.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    user_answer = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    essay_topic = relationship("EssayQATopic")
    user = relationship("User")


# New Student Project Models
class StudentProject(Base):
    __tablename__ = "student_projects"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)  # Firebase UID
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    
    # Relationships
    user = relationship("User", back_populates="student_projects")
    contents = relationship("StudentProjectContent", back_populates="project")
    quiz_references = relationship("StudentProjectQuizReference", back_populates="project")
    flashcard_references = relationship("StudentProjectFlashcardReference", back_populates="project")
    essay_references = relationship("StudentProjectEssayReference", back_populates="project")


class StudentProjectContent(Base):
    __tablename__ = "student_project_contents"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("student_projects.id"), nullable=False)
    content_type = Column(String, nullable=False)  # pdf, url, text
    name = Column(String, nullable=False)
    content_url = Column(String, nullable=True)  # For PDFs and URLs
    content_text = Column(Text, nullable=True)  # For text content
    file_size = Column(Integer, nullable=True)  # For PDFs
    uploaded_at = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    project = relationship("StudentProject", back_populates="contents")


class StudentProjectQuizReference(Base):
    __tablename__ = "student_project_quiz_references"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("student_projects.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("student_project_contents.id"), nullable=True)  # Added content_id
    quiz_topic_id = Column(Integer, ForeignKey("quiz_topics.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    project = relationship("StudentProject", back_populates="quiz_references")
    content = relationship("StudentProjectContent")  # Added relationship
    quiz_topic = relationship("QuizTopic")


class StudentProjectFlashcardReference(Base):
    __tablename__ = "student_project_flashcard_references"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("student_projects.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("student_project_contents.id"), nullable=True)  # Added content_id
    flashcard_topic_id = Column(Integer, ForeignKey("flashcard_topics.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    project = relationship("StudentProject", back_populates="flashcard_references")
    content = relationship("StudentProjectContent")  # Added relationship
    flashcard_topic = relationship("FlashcardTopic")


class StudentProjectEssayReference(Base):
    __tablename__ = "student_project_essay_references"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("student_projects.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("student_project_contents.id"), nullable=True)  # Added content_id
    essay_topic_id = Column(Integer, ForeignKey("Essay_qa_topics.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now)
    
    # Relationships
    project = relationship("StudentProject", back_populates="essay_references")
    content = relationship("StudentProjectContent")  # Added relationship
    essay_topic = relationship("EssayQATopic")
