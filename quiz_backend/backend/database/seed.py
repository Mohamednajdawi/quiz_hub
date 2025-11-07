"""Simple development seed script.

This script populates a handful of entities so the frontend has data to render
immediately after running migrations. It is intended for local development and
should not be executed against production data without review.
"""

from __future__ import annotations

import datetime
import os
from typing import Iterable

from sqlalchemy.exc import IntegrityError

from backend.database.db import SessionLocal
from backend.database.sqlite_dal import (
    QuizTopic,
    FlashcardTopic,
    EssayQATopic,
    User,
)
from backend.utils.auth import get_password_hash


def _ensure_user(session) -> None:
    demo_email = os.getenv("SEED_DEMO_EMAIL", "demo@example.com")
    if session.query(User).filter(User.email == demo_email).first():
        return

    user = User(
        id="demo-user",
        email=demo_email,
        password_hash=get_password_hash(os.getenv("SEED_DEMO_PASSWORD", "demo123")),
        first_name="Demo",
        last_name="User",
        birth_date=datetime.date(2000, 1, 1),
        gender="prefer_not_to_say",
        is_active=True,
    )
    session.add(user)


def _ensure_topics(session) -> None:
    quiz_topics: Iterable[QuizTopic] = [
        QuizTopic(topic="Python Basics", category="Programming", subcategory="Python", difficulty="easy"),
        QuizTopic(topic="World History", category="History", subcategory="General", difficulty="medium"),
    ]

    flashcard_topics: Iterable[FlashcardTopic] = [
        FlashcardTopic(topic="Biology Terms", category="Science", subcategory="Biology", difficulty="medium"),
        FlashcardTopic(topic="Spanish Vocabulary", category="Languages", subcategory="Spanish", difficulty="easy"),
    ]

    essay_topics: Iterable[EssayQATopic] = [
        EssayQATopic(topic="Climate Change", category="Environment", subcategory="Climate", difficulty="medium"),
        EssayQATopic(topic="Modern Art", category="Art", subcategory="20th Century", difficulty="hard"),
    ]

    for collection in (quiz_topics, flashcard_topics, essay_topics):
        for topic in collection:
            session.merge(topic)


def seed() -> None:
    session = SessionLocal()
    try:
        _ensure_user(session)
        _ensure_topics(session)
        session.commit()
        print("✅ Seed data inserted successfully")
    except IntegrityError as exc:
        session.rollback()
        print(f"⚠️ Seed aborted due to integrity error: {exc}")
    finally:
        session.close()


if __name__ == "__main__":
    seed()

