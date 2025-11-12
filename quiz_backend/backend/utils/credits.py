from http import HTTPStatus

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from backend.config import get_free_generation_quota
from backend.database.sqlite_dal import User, Subscription, QuizTopic, FlashcardTopic, EssayQATopic


def _payment_required_message() -> str:
    quota = get_free_generation_quota()
    return (
        f"You have reached the {quota} free generations included with the starter plan. "
        "Visit /pricing to upgrade and continue creating content."
    )


def _pro_limit_message() -> str:
    return (
        "You have reached your monthly limit of 200 generations for Pro users. "
        "Your limit will reset at the start of your next billing period. "
        "Visit /pricing to manage your subscription."
    )


def has_active_subscription(db: Session, user: User) -> bool:
    """Check if user has an active subscription"""
    active_subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.status == "active"
    ).first()
    return active_subscription is not None


def get_active_subscription(db: Session, user: User) -> Subscription | None:
    """Get the user's active subscription"""
    return db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.status == "active"
    ).first()


def count_monthly_generations(db: Session, user: User, subscription: Subscription) -> int:
    """
    Count the number of generations (quizzes, flashcards, essays) created by the user
    within the current billing period.
    """
    period_start = subscription.current_period_start
    period_end = subscription.current_period_end
    
    # Count quizzes created in this period
    quiz_count = db.query(QuizTopic).filter(
        and_(
            QuizTopic.created_by_user_id == user.id,
            QuizTopic.creation_timestamp >= period_start,
            QuizTopic.creation_timestamp < period_end
        )
    ).count()
    
    # Count flashcards created in this period
    flashcard_count = db.query(FlashcardTopic).filter(
        and_(
            FlashcardTopic.created_by_user_id == user.id,
            FlashcardTopic.creation_timestamp >= period_start,
            FlashcardTopic.creation_timestamp < period_end
        )
    ).count()
    
    # Count essays created in this period
    essay_count = db.query(EssayQATopic).filter(
        and_(
            EssayQATopic.created_by_user_id == user.id,
            EssayQATopic.creation_timestamp >= period_start,
            EssayQATopic.creation_timestamp < period_end
        )
    ).count()
    
    return quiz_count + flashcard_count + essay_count


def consume_generation_token(db: Session, user: User, amount: int = 1) -> None:
    """
    Consume generation tokens for a user.
    Pro users with active subscriptions have 200 generations per month (resets each billing period).
    Free users consume tokens from their free_tokens balance.
    """
    if amount <= 0:
        return

    # Check if user has active subscription
    subscription = get_active_subscription(db, user)
    if subscription:
        # Pro users have 200 generations per month
        monthly_generations = count_monthly_generations(db, user, subscription)
        pro_monthly_limit = 200
        
        if monthly_generations >= pro_monthly_limit:
            raise HTTPException(
                status_code=HTTPStatus.PAYMENT_REQUIRED,
                detail=_pro_limit_message(),
            )
        # Pro users don't consume free_tokens, but we track monthly generations
        return

    # For free users, check and consume tokens
    if user.free_tokens is None:
        return

    if user.free_tokens < amount:
        raise HTTPException(
            status_code=HTTPStatus.PAYMENT_REQUIRED,
            detail=_payment_required_message(),
        )

    user.free_tokens -= amount
    if user.free_tokens < 0:
        user.free_tokens = 0

    db.add(user)

