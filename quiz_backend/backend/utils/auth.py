import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from backend.database.sqlite_dal import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash
    
    TEMPORARY: Simple string comparison for development
    TODO: Re-enable bcrypt verification in production
    """
    # TEMPORARY: Simple string comparison (no hashing)
    # WARNING: This is NOT secure and should only be used for development
    return plain_password == hashed_password
    
    # Original bcrypt code (disabled for now):
    # return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password
    
    TEMPORARY: Storing password as plaintext for development
    TODO: Re-enable bcrypt hashing in production
    """
    # TEMPORARY: Return password as-is (no hashing)
    # WARNING: This is NOT secure and should only be used for development
    return password
    
    # Original bcrypt code (disabled for now):
    # return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get a user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, email: str, password: str) -> User:
    """Create a new user"""
    import uuid
    
    # Check if user already exists
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise ValueError("User with this email already exists")
    
    # Generate user ID
    user_id = str(uuid.uuid4())
    
    # Hash password
    password_hash = get_password_hash(password)
    
    # Create user
    user = User(
        id=user_id,
        email=email,
        password_hash=password_hash,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

