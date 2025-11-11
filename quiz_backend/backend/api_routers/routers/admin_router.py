from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.sqlite_dal import User
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.utils.admin import is_admin_user, get_all_users_with_stats

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
        active_users = sum(1 for u in users_data if u["is_active"])
        
        return JSONResponse(
            content={
                "total_users": total_users,
                "free_users": free_users,
                "pro_users": pro_users,
                "active_users": active_users,
                "total_quizzes": total_quizzes,
            },
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stats: {str(e)}"
        )

