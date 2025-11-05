import os
import shutil
import tempfile
import datetime
import requests
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging

from backend.api_routers.schemas import URLRequest
from backend.database.db import get_db
from backend.database.sqlite_dal import QuizQuestion, QuizTopic
from backend.utils.utils import generate_quiz, generate_quiz_from_pdf
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.database.sqlite_dal import User as UserModel

router = APIRouter()


@router.post("/generate-quiz", tags=["Quiz"])
async def create_quiz(
    request: URLRequest, db: Session = Depends(get_db)
) -> JSONResponse:
    try:
        # Remove trailing slash if present
        url = str(request.url).rstrip("/")

        # Validate difficulty level
        if request.difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid difficulty level. Choose from: easy, medium, hard",
            )

        quiz_data = generate_quiz(url, request.num_questions, request.difficulty) # Renamed to avoid conflict

        # Store quiz in database
        quiz_topic = QuizTopic(
            topic=quiz_data["topic"],
            category=quiz_data["category"],
            subcategory=quiz_data["subcategory"],
            difficulty=request.difficulty,  # Store the difficulty level
            creation_timestamp=datetime.datetime.now()
        )
        db.add(quiz_topic)
        db.flush()  # Get the ID of the newly created topic

        # Add questions
        for q in quiz_data["questions"]:
            quiz_question = QuizQuestion(
                question=q["question"],
                options=q["options"],
                right_option=q["right_option"],
                topic_id=quiz_topic.id,
            )
            db.add(quiz_question)

        db.commit()
        return JSONResponse(
            content=quiz_data,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404, detail=f"Content not found at URL: {request.url}"
            )
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/generate-quiz-from-pdf", tags=["Quiz"])
async def create_quiz_from_pdf(
    pdf_file: UploadFile = File(None),  # Make optional when content_id is provided
    num_questions: int = Form(5),
    difficulty: str = Form("medium"),
    project_id: int = Form(None),  # Optional project ID
    content_id: int = Form(None),  # Optional content ID
    db: Session = Depends(get_db)
) -> JSONResponse:
    try:
        # Validate difficulty level
        if difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid difficulty level. Choose from: easy, medium, hard",
            )
        
        temp_file_path = None
        
        # If content_id is provided, use the stored PDF file
        if content_id is not None:
            from backend.database.sqlite_dal import StudentProjectContent
            content = db.query(StudentProjectContent).filter(
                StudentProjectContent.id == content_id
            ).first()
            
            if not content:
                raise HTTPException(status_code=404, detail="Content not found")
            
            if content.content_type != 'pdf':
                raise HTTPException(status_code=400, detail="Content is not a PDF file")
            
            if not content.content_url or not os.path.exists(content.content_url):
                raise HTTPException(status_code=404, detail="PDF file not found on server")
            
            # Use the stored PDF file path
            temp_file_path = content.content_url
            logging.warning(f"[QUIZ] Using stored PDF from content_id {content_id}: {temp_file_path}")
        else:
            # No content_id provided, require PDF file upload
            if pdf_file is None:
                raise HTTPException(
                    status_code=400,
                    detail="Either a PDF file or content_id must be provided"
                )
            
            # Validate file type
            filename = pdf_file.filename or ''
            content_type = pdf_file.content_type or ''
            
            is_pdf_filename = filename.lower().endswith('.pdf')
            is_pdf_mime = content_type.lower() in ['application/pdf', 'application/x-pdf', 'application/x-bzpdf', 'application/x-gzpdf']
            
            if not is_pdf_filename and not is_pdf_mime:
                raise HTTPException(
                    status_code=400,
                    detail=f"Only PDF files are accepted. Received: filename='{filename}', content_type='{content_type}'"
                )
                
            # Create a temporary file to store the uploaded PDF
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                # Copy the uploaded file to the temporary file
                shutil.copyfileobj(pdf_file.file, temp_file)
                temp_file_path = temp_file.name
            
        try:
            # Generate quiz from the PDF
            quiz_data = generate_quiz_from_pdf(temp_file_path, num_questions, difficulty)
            
            # Store quiz in database
            try:
                # Try to create with difficulty first
                quiz_topic = QuizTopic(
                    topic=quiz_data["topic"],
                    category=quiz_data["category"],
                    subcategory=quiz_data["subcategory"],
                    difficulty=difficulty,  # Store the difficulty level
                    creation_timestamp=datetime.datetime.now()
                )
                db.add(quiz_topic)
                db.flush()  # Get the ID of the newly created topic
            except Exception as e:
                # Fallback: create without difficulty if column doesn't exist
                logging.warning(f"Creating quiz topic without difficulty column: {e}")
                db.rollback()  # Rollback the failed transaction
                
                # Create without difficulty field
                quiz_topic = QuizTopic(
                    topic=quiz_data["topic"],
                    category=quiz_data["category"],
                    subcategory=quiz_data["subcategory"],
                    creation_timestamp=datetime.datetime.now()
                )
                db.add(quiz_topic)
                db.flush()  # Get the ID of the newly created topic

            # Add questions
            for q in quiz_data["questions"]:
                quiz_question = QuizQuestion(
                    question=q["question"],
                    options=q["options"],
                    right_option=q["right_option"],
                    topic_id=quiz_topic.id,
                )
                db.add(quiz_question)

            # If project_id is provided, create a reference
            if project_id is not None:
                from backend.database.sqlite_dal import StudentProjectQuizReference
                quiz_reference = StudentProjectQuizReference(
                    project_id=project_id,
                    content_id=content_id,  # Add content_id
                    quiz_topic_id=quiz_topic.id,
                    created_at=datetime.datetime.now()
                )
                db.add(quiz_reference)

            db.commit()
            return JSONResponse(
                content=quiz_data,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        finally:
            # Clean up the temporary file only if it was uploaded (not from content_id)
            if content_id is None and temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    logging.warning(f"Failed to delete temporary file {temp_file_path}: {e}")
                
    except ValueError as e:
        # Handle PDF text extraction errors specifically
        if "no extractable text" in str(e).lower():
            raise HTTPException(
                status_code=422, 
                detail="This PDF contains no extractable text. It may be a scanned document or contain only images. Please use a text-based PDF or convert the scanned PDF to text first."
            )
        raise HTTPException(
            status_code=400, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/quiz-topics/my", tags=["Quiz"])
async def get_my_quiz_topics(
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get quiz topics for the current authenticated user (from projects + directly generated)"""
    from backend.database.sqlite_dal import StudentProject, StudentProjectQuizReference, QuizAttempt
    
    user_id = current_user.id
    logging.warning(f"[QUIZ] Fetching user quizzes for user: {user_id}")
    
    quiz_topic_ids = set()
    
    # 1. Get quizzes from user's projects
    user_projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).all()
    project_ids = [project.id for project in user_projects]
    
    if project_ids:
        quiz_references = db.query(StudentProjectQuizReference).filter(
            StudentProjectQuizReference.project_id.in_(project_ids)
        ).all()
        quiz_topic_ids.update([ref.quiz_topic_id for ref in quiz_references])
    
    # 2. Get quizzes the user has attempted (directly generated quizzes)
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).all()
    quiz_topic_ids.update([attempt.topic_id for attempt in quiz_attempts])
    
    if not quiz_topic_ids:
        logging.warning(f"[QUIZ] No quizzes found for user: {user_id}")
        return JSONResponse(
            content={"topics": []},
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    
    # Get the quiz topics
    topics = db.query(QuizTopic).filter(QuizTopic.id.in_(quiz_topic_ids)).order_by(QuizTopic.creation_timestamp.desc()).all()
    
    logging.warning(f"[QUIZ] Found {len(topics)} quizzes for user: {user_id} (from projects: {len(project_ids) if project_ids else 0}, from attempts: {len(quiz_attempts)})")
    
    return JSONResponse(
        content={
            "topics": [
                {
                    "id": topic.id,
                    "topic": topic.topic,
                    "category": topic.category,
                    "subcategory": topic.subcategory,
                    "difficulty": topic.difficulty if hasattr(topic, 'difficulty') else None,
                    "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
                }
                for topic in topics
            ]
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/quiz-topics", tags=["Quiz"])
async def get_all_quiz_topics(db: Session = Depends(get_db)) -> JSONResponse:
    """Get all quiz topics"""
    topics = db.query(QuizTopic).all()
    
    return JSONResponse(
        content={
            "topics": [
                {
                    "id": topic.id,
                    "topic": topic.topic,
                    "category": topic.category,
                    "subcategory": topic.subcategory,
                    "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
                }
                for topic in topics
            ]
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    ) 


@router.get("/quiz/{topic_id}", tags=["Quiz"])
async def get_quiz(topic_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """Get a specific quiz by topic ID"""
    topic = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Quiz topic not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.topic_id == topic_id).all()
    return JSONResponse(
        content={
            "topic": topic.topic,
            "category": topic.category,
            "subcategory": topic.subcategory,
            "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
            "questions": [
                {
                    "question": q.question,
                    "options": q.options,
                    "right_option": q.right_option,
                }
                for q in questions
            ],
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )
