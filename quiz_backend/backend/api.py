from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Load environment variables at startup
load_dotenv() # Keep this if it's not loaded elsewhere, e.g. in uvicorn launch script

from backend.api_routers.routers import (
    attempt_router,
    health_router,
    quiz_router,
    topic_router,
    flashcard_router,
    essay_qa_router,
    student_project_router,
    auth_router,
    config_router,
    admin_router,
    payment_router,
    gdpr_router,
)
from backend.middleware.rate_limit import RateLimitMiddleware

app = FastAPI(title="Quiz Maker API")

# Configure CORS
# Get allowed origins from environment variable (comma-separated)
# If not set, allow all origins but disable credentials (for development)
cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_origins_env:
    # Parse comma-separated origins
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    allow_credentials = True
    print(f"[CORS] Configured with specific origins: {allowed_origins}")
else:
    # Development mode: allow all origins but disable credentials
    # (browsers don't allow credentials with wildcard origins)
    allowed_origins = ["*"]
    allow_credentials = False
    print("[CORS] WARNING: Allowing all origins (development mode). Set CORS_ALLOWED_ORIGINS for production!")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], 
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add rate limiting middleware (can be disabled via environment variable)
if os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true":
    app.add_middleware(RateLimitMiddleware)

# Include routers
app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(quiz_router.router)
app.include_router(flashcard_router.router)
app.include_router(essay_qa_router.router)
app.include_router(topic_router.router)
app.include_router(attempt_router.router)
app.include_router(health_router.router)
app.include_router(student_project_router.router)
app.include_router(config_router.router)
app.include_router(admin_router.router)
app.include_router(payment_router.router)
app.include_router(gdpr_router.router)
