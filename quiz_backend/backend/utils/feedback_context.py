from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.database.sqlite_dal import EssayAnswer, QuizAttempt

_DEFAULT_MAX_CHARS = 1500


def collect_feedback_context(
    db: Session,
    *,
    user_id: Optional[str],
    quiz_topic_ids: Optional[Sequence[int]] = None,
    essay_topic_ids: Optional[Sequence[int]] = None,
    max_entries: int = 4,
    max_chars: int = _DEFAULT_MAX_CHARS,
) -> Optional[str]:
    """
    Aggregate recent AI feedback snippets for a learner so new generations can
    emphasize weak topics.

    Args:
        db: Active SQLAlchemy session.
        user_id: The learner's ID. Required to fetch personalized feedback.
        quiz_topic_ids: Optional list of quiz topic IDs to scope the search.
        essay_topic_ids: Optional list of essay topic IDs to scope the search.
        max_entries: Maximum feedback snippets to return.
        max_chars: Maximum total characters for the combined context.

    Returns:
        A newline-delimited string of recent feedback, or None if nothing found.
    """

    if not user_id:
        return None

    feedback_records: list[tuple] = []

    quiz_query = (
        db.query(QuizAttempt.timestamp, QuizAttempt.ai_feedback)
        .filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.ai_feedback.isnot(None),
            QuizAttempt.ai_feedback != "",
        )
        .order_by(desc(QuizAttempt.timestamp))
    )
    if quiz_topic_ids:
        quiz_query = quiz_query.filter(QuizAttempt.topic_id.in_(quiz_topic_ids))
    feedback_records.extend(quiz_query.limit(max_entries).all())

    essay_query = (
        db.query(EssayAnswer.timestamp, EssayAnswer.ai_feedback)
        .filter(
            EssayAnswer.user_id == user_id,
            EssayAnswer.ai_feedback.isnot(None),
            EssayAnswer.ai_feedback != "",
        )
        .order_by(desc(EssayAnswer.timestamp))
    )
    if essay_topic_ids:
        essay_query = essay_query.filter(EssayAnswer.essay_topic_id.in_(essay_topic_ids))
    feedback_records.extend(essay_query.limit(max_entries).all())

    if not feedback_records:
        return None

    # Sort combined list by timestamp descending
    feedback_records.sort(key=lambda item: item[0], reverse=True)

    snippets: list[str] = []
    seen_texts: set[str] = set()
    for _, raw_text in feedback_records:
        if not raw_text:
            continue
        cleaned = raw_text.strip()
        if not cleaned:
            continue
        if cleaned in seen_texts:
            continue
        snippets.append(cleaned)
        seen_texts.add(cleaned)
        if len(snippets) >= max_entries:
            break

    if not snippets:
        return None

    combined = "Recent AI feedback highlights:\n" + "\n---\n".join(snippets)
    if len(combined) > max_chars:
        combined = combined[:max_chars]
    return combined

