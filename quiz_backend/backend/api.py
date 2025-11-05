from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
)

app = FastAPI(title="Quiz Maker API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(quiz_router.router)
app.include_router(flashcard_router.router)
app.include_router(essay_qa_router.router)
app.include_router(topic_router.router)
app.include_router(attempt_router.router)
app.include_router(health_router.router)
app.include_router(student_project_router.router)
