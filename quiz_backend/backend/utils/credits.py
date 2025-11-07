from http import HTTPStatus

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.config import get_free_generation_quota
from backend.database.sqlite_dal import User


def _payment_required_message() -> str:
    quota = get_free_generation_quota()
    return (
        f"You have reached the {quota} free generations included with the starter plan. "
        "Visit /pricing to upgrade and continue creating content."
    )


def consume_generation_token(db: Session, user: User, amount: int = 1) -> None:
    if amount <= 0:
        return

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

