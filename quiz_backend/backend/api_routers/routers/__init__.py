# This file makes Python treat the 'routers' directory as a package. 
__all__ = ["attempt_router", "health_router", "quiz_router", "topic_router", "flashcard_router", "essay_qa_router", "student_project_router", "auth_router", "config_router", "admin_router", "payment_router", "gdpr_router"]

# Import the modules themselves, so api.py can access module.router
from . import attempt_router
from . import health_router
from . import quiz_router
from . import topic_router
from . import flashcard_router
from . import essay_qa_router
from . import student_project_router
from . import auth_router
from . import config_router
from . import admin_router
from . import payment_router
from . import gdpr_router

