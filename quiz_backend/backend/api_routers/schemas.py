import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, HttpUrl, EmailStr


class URLRequest(BaseModel):
    url: HttpUrl
    num_questions: Optional[int] = None  # Automatic question count by default
    difficulty: str = (
        "medium"  # Default to medium difficulty, options: easy, medium, hard
    )


class FlashcardRequest(BaseModel):
    url: HttpUrl
    num_cards: int = 10  # Default to 10 flashcards


class EssayQARequest(BaseModel):
    url: HttpUrl
    num_questions: int = 3  # Default to 3 questions for detailed Essay QA
    difficulty: str = (
        "medium"  # Default to medium difficulty, options: easy, medium, hard
    )


class QuizResponse(BaseModel):
    topic: str
    category: str
    subcategory: str
    questions: List[Dict[str, Any]]


class EssayQAResponse(BaseModel):
    topic: str
    category: str
    subcategory: str
    questions: List[Dict[str, Any]]


class TopicResponse(BaseModel):
    id: int
    topic: str
    category: str
    subcategory: str
    creation_timestamp: Optional[datetime.datetime] = None


class QuizAttemptRequest(BaseModel):
    topic_id: int


# New detailed quiz attempt schemas
class QuizAttemptResultRequest(BaseModel):
    topic_id: int
    user_id: Optional[str] = None  # Firebase UID
    score: int
    total_questions: int
    time_taken_seconds: int
    user_answers: List[int]  # List of user's answer indices
    correct_answers: List[int]  # List of correct answer indices
    difficulty_level: Optional[str] = None  # easy, medium, hard
    source_type: Optional[str] = None  # url, pdf, available
    source_info: Optional[str] = None  # URL or filename
    question_performance: Optional[List[Dict[str, Any]]] = None  # Detailed per-question performance


class QuizAttemptResponse(BaseModel):
    id: int
    user_id: Optional[str]
    topic_id: int
    timestamp: datetime.datetime
    score: int
    total_questions: int
    time_taken_seconds: int
    percentage_score: float
    user_answers: List[int]
    correct_answers: List[int]
    difficulty_level: Optional[str]
    source_type: Optional[str]
    source_info: Optional[str]
    question_performance: Optional[List[Dict[str, Any]]]
    ai_feedback: Optional[str]


class QuizAttemptSummaryResponse(BaseModel):
    id: int
    topic_id: int
    topic_name: str
    category: str
    subcategory: str
    timestamp: datetime.datetime
    score: int
    total_questions: int
    percentage_score: float
    time_taken_seconds: int
    difficulty_level: Optional[str]
    source_type: Optional[str]
    ai_feedback: Optional[str]


class UserQuizHistoryResponse(BaseModel):
    user_id: str
    attempts: List[QuizAttemptSummaryResponse]
    total_attempts: int
    average_score: float
    best_score: float
    total_time_spent: int  # in seconds


# Payment-related schemas
class UserCreate(BaseModel):
    email: EmailStr
    firebase_uid: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    firebase_uid: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime


class SubscriptionCreate(BaseModel):
    plan_type: str  # basic, premium, enterprise
    payment_method_id: str


class SubscriptionResponse(BaseModel):
    id: int
    user_id: str
    stripe_subscription_id: str
    plan_type: str
    status: str
    current_period_start: datetime.datetime
    current_period_end: datetime.datetime
    cancel_at_period_end: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime


class PaymentMethodCreate(BaseModel):
    payment_method_id: str
    type: str  # card, bank_account
    last4: Optional[str] = None
    brand: Optional[str] = None
    is_default: bool = False


class PaymentMethodResponse(BaseModel):
    id: int
    user_id: str
    stripe_payment_method_id: str
    type: str
    last4: Optional[str] = None
    brand: Optional[str] = None
    is_default: bool
    created_at: datetime.datetime


class TransactionResponse(BaseModel):
    id: int
    user_id: str
    stripe_payment_intent_id: str
    amount: float
    currency: str
    status: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime


class CreatePaymentIntentRequest(BaseModel):
    amount: int  # Amount in cents
    currency: str = "usd"
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str


class WebhookEvent(BaseModel):
    type: str
    data: Dict[str, Any]


class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: int  # Price in cents
    currency: str = "usd"
    interval: str  # month, year
    features: List[str]
    stripe_price_id: str


# Student Project schemas
class StudentProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class StudentProjectContentCreate(BaseModel):
    content_type: str  # pdf, url, text
    name: str
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    file_size: Optional[int] = None


class StudentProjectContentResponse(BaseModel):
    id: int
    content_type: str
    name: str
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: datetime.datetime


class StudentProjectResponse(BaseModel):
    id: int
    user_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    contents: List[StudentProjectContentResponse] = []
    quiz_references: List[int] = []  # List of quiz topic IDs
    flashcard_references: List[int] = []  # List of flashcard topic IDs
    essay_references: List[int] = []  # List of essay topic IDs
    mind_map_references: List[int] = []  # List of mind map IDs


class MindMapResponse(BaseModel):
    id: int
    title: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    central_idea: str
    summary: Optional[str] = None
    key_concepts: List[Dict[str, Any]] = []
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    connections: List[Dict[str, Any]] = []
    callouts: List[Dict[str, Any]] = []
    recommended_next_steps: List[str] = []
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime.datetime] = None


class StudentProjectListResponse(BaseModel):
    projects: List[StudentProjectResponse]
    total_count: int


class StudentProjectReferenceCreate(BaseModel):
    reference_type: str  # quiz, flashcard, essay
    topic_id: int


class StoreEssayAnswerRequest(BaseModel):
    essay_id: int
    user_id: str
    question_index: int
    user_answer: str
    timestamp: str


class StoreEssayAnswersRequest(BaseModel):
    essay_id: int
    user_id: str
    answers: list[dict]  # List of {question_index: int, user_answer: str}
    timestamp: str 