from datetime import date, timedelta
from enum import Enum
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from backend.database.db import get_db
from backend.database.sqlite_dal import User
from backend.utils.auth import (
    authenticate_user,
    create_access_token,
    create_user,
    get_user_by_id,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


class Gender(str, Enum):
    male = "male"
    female = "female"
    non_binary = "non_binary"
    prefer_not_to_say = "prefer_not_to_say"
    other = "other"


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birth_date: date
    gender: Gender


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    first_name: Optional[str]
    last_name: Optional[str]
    birth_date: Optional[date]
    gender: Optional[Gender]
    free_tokens: Optional[int]


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    birth_date: Optional[date] = None
    gender: Optional[Gender] = None

    def apply(self, user: User) -> None:
        if self.first_name is not None:
            user.first_name = self.first_name
        if self.last_name is not None:
            user.last_name = self.last_name
        if self.birth_date is not None:
            user.birth_date = self.birth_date
        if self.gender is not None:
            user.gender = self.gender.value if isinstance(self.gender, Enum) else self.gender


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        _validate_birth_date(user_data.birth_date)

        user = create_user(
            db,
            user_data.email,
            user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            birth_date=user_data.birth_date,
            gender=user_data.gender.value,
        )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email}
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=_serialize_user(user),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}",
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=_serialize_user(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return _serialize_user(user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if update_data.birth_date is not None:
        _validate_birth_date(update_data.birth_date)

    update_data.apply(user)
    db.add(user)
    db.commit()
    db.refresh(user)

    return _serialize_user(user)


# Optional dependency to get current user
async def get_optional_current_user_dependency(
    token: Optional[str] = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None

    payload = verify_token(token)
    if payload is None:
        return None

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        return None

    user = get_user_by_id(db, user_id)
    return user


# Dependency to get current user
async def get_current_user_dependency(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user"""
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


def _serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        first_name=user.first_name,
        last_name=user.last_name,
        birth_date=user.birth_date,
        gender=Gender(user.gender) if user.gender else None,
        free_tokens=user.free_tokens,
    )


def _validate_birth_date(birth_date_value: date) -> None:
    today = date.today()
    if birth_date_value > today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Birth date cannot be in the future",
        )

    age_years = today.year - birth_date_value.year - (
        (today.month, today.day) < (birth_date_value.month, birth_date_value.day)
    )
    if age_years < 13:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be at least 13 years old to register",
        )

