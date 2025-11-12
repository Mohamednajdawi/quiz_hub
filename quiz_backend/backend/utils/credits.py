from http import HTTPStatus

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.config import get_free_generation_quota
from backend.database.sqlite_dal import User, Subscription


def _payment_required_message() -> str:
    quota = get_free_generation_quota()
    return (
        f"You have reached the {quota} free generations included with the starter plan. "
        "Visit /pricing to upgrade and continue creating content."
    )


def has_active_subscription(db: Session, user: User) -> bool:
    """Check if user has an active subscription"""
    active_subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.status == "active"
    ).first()
    return active_subscription is not None


def consume_generation_token(db: Session, user: User, amount: int = 1) -> None:
    """
    Consume generation tokens for a user.
    Pro users with active subscriptions have unlimited generations and skip token consumption.
    Free users consume tokens from their free_tokens balance.
    """
    if amount <= 0:
        return

    # Check if user has active subscription - Pro users get unlimited generations
    if has_active_subscription(db, user):
        # Pro users don't consume tokens, they have unlimited generations
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

