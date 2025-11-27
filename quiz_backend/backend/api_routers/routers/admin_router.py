from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.sqlite_dal import User, TokenUsage, GenerationJob
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.utils.admin import is_admin_user, get_all_users_with_stats
from sqlalchemy import func

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user_dependency)) -> User:
    """
    Dependency to ensure the current user is an admin.
    """
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/admin/users", tags=["Admin"])
async def get_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Get all users with their account information, subscription status, and quiz counts.
    Admin access required.
    """
    try:
        users_data = get_all_users_with_stats(db)
        
        return JSONResponse(
            content={
                "users": users_data,
                "total": len(users_data)
            },
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )


@router.get("/admin/check", tags=["Admin"])
async def check_admin_status(
    current_user: User = Depends(get_current_user_dependency)
) -> JSONResponse:
    """
    Check if the current user is an admin.
    Returns admin status without requiring admin privileges.
    """
    is_admin = is_admin_user(current_user)
    return JSONResponse(
        content={"is_admin": is_admin},
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/admin/stats", tags=["Admin"])
async def get_admin_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Get overall admin statistics.
    Admin access required.
    """
    try:
        users_data = get_all_users_with_stats(db)
        
        total_users = len(users_data)
        free_users = sum(1 for u in users_data if u["account_type"] == "free")
        pro_users = sum(1 for u in users_data if u["account_type"] == "pro")
        total_quizzes = sum(u["quiz_count"] for u in users_data)
        total_flashcards = sum(u.get("flashcard_count", 0) for u in users_data)
        total_essays = sum(u.get("essay_count", 0) for u in users_data)
        active_users = sum(1 for u in users_data if u["is_active"])
        
        # Calculate token usage statistics
        # From TokenUsage table (direct generations)
        token_usage_stats = db.query(
            func.sum(TokenUsage.input_tokens).label("total_input_tokens"),
            func.sum(TokenUsage.output_tokens).label("total_output_tokens"),
            func.sum(TokenUsage.total_tokens).label("total_tokens"),
        ).first()
        
        # From GenerationJob table (async jobs)
        job_token_stats = db.query(
            func.sum(GenerationJob.input_tokens).label("job_input_tokens"),
            func.sum(GenerationJob.output_tokens).label("job_output_tokens"),
            func.sum(GenerationJob.total_tokens).label("job_total_tokens"),
        ).filter(
            GenerationJob.input_tokens.isnot(None)
        ).first()
        
        # Combine token statistics
        total_input_tokens = (token_usage_stats.total_input_tokens or 0) + (job_token_stats.job_input_tokens or 0)
        total_output_tokens = (token_usage_stats.total_output_tokens or 0) + (job_token_stats.job_output_tokens or 0)
        total_tokens = (token_usage_stats.total_tokens or 0) + (job_token_stats.job_total_tokens or 0)
        
        return JSONResponse(
            content={
                "total_users": total_users,
                "free_users": free_users,
                "pro_users": pro_users,
                "active_users": active_users,
                "total_quizzes": total_quizzes,
                "total_flashcards": total_flashcards,
                "total_essays": total_essays,
                "total_input_tokens": int(total_input_tokens),
                "total_output_tokens": int(total_output_tokens),
                "total_tokens": int(total_tokens),
            },
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stats: {str(e)}"
        )

