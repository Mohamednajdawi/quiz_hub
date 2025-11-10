import os
import shutil
import tempfile
import datetime
import requests
import random
import string
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging

from backend.api_routers.schemas import URLRequest
from backend.database.db import get_db
from backend.database.sqlite_dal import QuizQuestion, QuizTopic, QuizAttempt
from backend.utils.utils import generate_quiz, generate_quiz_from_pdf
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.database.sqlite_dal import User as UserModel
from backend.utils.credits import consume_generation_token

router = APIRouter()


def generate_share_code(db: Session) -> str:
    """Generate a unique 6-digit share code"""
    max_attempts = 100
    for _ in range(max_attempts):
        code = ''.join(random.choices(string.digits, k=6))
        # Check if code already exists
        existing = db.query(QuizTopic).filter(QuizTopic.share_code == code).first()
        if not existing:
            return code
    raise HTTPException(status_code=500, detail="Failed to generate unique share code")


@router.post("/generate-quiz", tags=["Quiz"])
async def create_quiz(
    request: URLRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user_dependency),
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
            creation_timestamp=datetime.datetime.now(),
            created_by_user_id=current_user.id
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

        consume_generation_token(db, current_user)
        db.commit()
        # Add quiz_id to response
        quiz_data_with_id = {**quiz_data, "quiz_id": quiz_topic.id}
        return JSONResponse(
            content=quiz_data_with_id,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404, detail=f"Content not found at URL: {request.url}"
            )
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
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
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user_dependency),
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
                    creation_timestamp=datetime.datetime.now(),
                    created_by_user_id=current_user.id
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
                    creation_timestamp=datetime.datetime.now(),
                    created_by_user_id=current_user.id
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

            consume_generation_token(db, current_user)
            db.commit()
            # Add quiz_id to response
            quiz_data_with_id = {**quiz_data, "quiz_id": quiz_topic.id}
            return JSONResponse(
                content=quiz_data_with_id,
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
        db.rollback()
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
    created_count = 0
    project_count = 0
    
    # 1. Get quizzes created by the user
    try:
        created_quizzes = db.query(QuizTopic).filter(QuizTopic.created_by_user_id == user_id).all()
        created_count = len(created_quizzes)
        quiz_topic_ids.update([quiz.id for quiz in created_quizzes])
        logging.warning(f"[QUIZ] Found {created_count} quizzes created by user: {user_id}")
    except Exception as e:
        # Column might not exist yet (migration not run)
        logging.warning(f"[QUIZ] Could not filter by created_by_user_id: {e}")
    
    # 2. Get quizzes from user's projects
    user_projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).all()
    project_ids = [project.id for project in user_projects]
    
    if project_ids:
        quiz_references = db.query(StudentProjectQuizReference).filter(
            StudentProjectQuizReference.project_id.in_(project_ids)
        ).all()
        project_count = len(quiz_references)
        quiz_topic_ids.update([ref.quiz_topic_id for ref in quiz_references])
        logging.warning(f"[QUIZ] Found {project_count} quizzes from user's projects")
    
    # Note: We don't include quizzes from attempts anymore - users should only see quizzes they created
    
    if not quiz_topic_ids:
        logging.warning(f"[QUIZ] No quizzes found for user: {user_id}")
        return JSONResponse(
            content={"topics": []},
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    
    # Get the quiz topics
    topics = db.query(QuizTopic).filter(QuizTopic.id.in_(quiz_topic_ids)).order_by(QuizTopic.creation_timestamp.desc()).all()
    
    logging.warning(f"[QUIZ] Found {len(topics)} quizzes for user: {user_id} (created: {created_count}, from projects: {project_count})")
    
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

    questions = db.query(QuizQuestion).filter(QuizQuestion.topic_id == topic_id).order_by(QuizQuestion.id).all()
    return JSONResponse(
        content={
            "topic": topic.topic,
            "category": topic.category,
            "subcategory": topic.subcategory,
            "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
            "questions": [
                {
                    "id": q.id,
                    "question": q.question,
                    "options": q.options,
                    "right_option": q.right_option,
                }
                for q in questions
            ],
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/quiz/{topic_id}/share-code", tags=["Quiz"])
async def get_share_code_for_quiz(
    topic_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get the share code for a quiz if it exists"""
    # Verify quiz exists
    quiz = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check if user is the creator OR has attempted the quiz
    from backend.database.sqlite_dal import QuizAttempt
    try:
        is_creator = quiz.created_by_user_id == current_user.id if quiz.created_by_user_id else False
    except AttributeError:
        # Column doesn't exist yet (migration not run)
        is_creator = False
    
    has_attempted = db.query(QuizAttempt).filter(
        QuizAttempt.topic_id == topic_id,
        QuizAttempt.user_id == current_user.id
    ).first() is not None
    
    # Special handling for quiz 999 (URL/PDF quizzes) - allow if user has attempted
    is_special_quiz = topic_id == 999
    
    if not is_creator and not has_attempted and not is_special_quiz:
        raise HTTPException(
            status_code=403,
            detail="You can only view share codes for quizzes you created or have attempted"
        )
    
    return JSONResponse(
        content={
            "quiz_id": quiz.id,
            "share_code": quiz.share_code,
            "topic": quiz.topic
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.post("/quiz/{topic_id}/generate-share-code", tags=["Quiz"])
async def generate_share_code_for_quiz(
    topic_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Generate a 6-digit share code for a quiz"""
    # Verify quiz exists
    quiz = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check if user is the creator OR has attempted the quiz
    from backend.database.sqlite_dal import QuizAttempt
    try:
        is_creator = quiz.created_by_user_id == current_user.id if quiz.created_by_user_id else False
    except AttributeError:
        # Column doesn't exist yet (migration not run)
        is_creator = False
    
    has_attempted = db.query(QuizAttempt).filter(
        QuizAttempt.topic_id == topic_id,
        QuizAttempt.user_id == current_user.id
    ).first() is not None
    
    # Special handling for quiz 999 (URL/PDF quizzes) - allow if user has attempted
    is_special_quiz = topic_id == 999
    
    if not is_creator and not has_attempted and not is_special_quiz:
        raise HTTPException(
            status_code=403,
            detail="You can only generate share codes for quizzes you created or have attempted"
        )
    
    # Generate new code if one doesn't exist
    if not quiz.share_code:
        quiz.share_code = generate_share_code(db)
        db.commit()
        db.refresh(quiz)
    
    return JSONResponse(
        content={
            "quiz_id": quiz.id,
            "share_code": quiz.share_code,
            "topic": quiz.topic
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/quiz/share/{share_code}", tags=["Quiz"])
async def get_quiz_by_share_code(
    share_code: str,
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get a quiz by its 6-digit share code (no authentication required)"""
    if len(share_code) != 6 or not share_code.isdigit():
        raise HTTPException(status_code=400, detail="Invalid share code format")
    
    quiz = db.query(QuizTopic).filter(QuizTopic.share_code == share_code).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions = db.query(QuizQuestion).filter(QuizQuestion.topic_id == quiz.id).all()
    return JSONResponse(
        content={
            "quiz_id": quiz.id,
            "topic": quiz.topic,
            "category": quiz.category,
            "subcategory": quiz.subcategory,
            "difficulty": quiz.difficulty,
            "creation_timestamp": quiz.creation_timestamp.isoformat() if quiz.creation_timestamp else None,
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


class SharedQuizSubmission(BaseModel):
    participant_name: str
    user_answers: List[int]
    time_taken_seconds: int


@router.post("/quiz/share/{share_code}/submit", tags=["Quiz"])
async def submit_shared_quiz(
    share_code: str,
    submission: SharedQuizSubmission,
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Submit a quiz attempt using a share code (no authentication required)"""
    if len(share_code) != 6 or not share_code.isdigit():
        raise HTTPException(status_code=400, detail="Invalid share code format")
    
    # Find quiz by share code
    quiz = db.query(QuizTopic).filter(QuizTopic.share_code == share_code).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Get questions to validate answers
    questions = db.query(QuizQuestion).filter(QuizQuestion.topic_id == quiz.id).all()
    if len(submission.user_answers) != len(questions):
        raise HTTPException(status_code=400, detail="Number of answers does not match number of questions")
    
    # Calculate score
    correct_answers = []
    user_answers = submission.user_answers
    score = 0
    
    for i, question in enumerate(questions):
        correct_answer = int(question.right_option) if question.right_option.isdigit() else ord(question.right_option.lower()) - ord('a')
        correct_answers.append(correct_answer)
        if i < len(user_answers) and user_answers[i] == correct_answer:
            score += 1
    
    total_questions = len(questions)
    percentage_score = (score / total_questions) * 100 if total_questions > 0 else 0
    
    # Create quiz attempt
    quiz_attempt = QuizAttempt(
        user_id=None,  # No user for shared quizzes
        topic_id=quiz.id,
        score=score,
        total_questions=total_questions,
        time_taken_seconds=submission.time_taken_seconds,
        percentage_score=percentage_score,
        user_answers=user_answers,
        correct_answers=correct_answers,
        difficulty_level=quiz.difficulty,
        is_shared_quiz=True,
        participant_name=submission.participant_name,
        share_code=share_code
    )
    
    db.add(quiz_attempt)
    db.commit()
    db.refresh(quiz_attempt)
    
    return JSONResponse(
        content={
            "message": "Quiz submitted successfully",
            "attempt_id": quiz_attempt.id,
            "score": score,
            "total_questions": total_questions,
            "percentage_score": round(percentage_score, 2),
            "timestamp": quiz_attempt.timestamp.isoformat()
        },
        status_code=201
    )


# Quiz editing endpoints
class QuestionUpdate(BaseModel):
    question: str
    options: List[str]
    right_option: int | str

class QuestionCreate(BaseModel):
    question: str
    options: List[str]
    right_option: int | str

class QuizUpdateRequest(BaseModel):
    questions: List[dict]  # List of question objects with id (for updates) or without id (for new)


@router.put("/quiz/{topic_id}/question/{question_id}", tags=["Quiz"])
async def update_quiz_question(
    topic_id: int,
    question_id: int,
    question_data: QuestionUpdate,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Update a specific quiz question"""
    # Verify quiz exists and user owns it
    quiz = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check ownership
    try:
        is_owner = quiz.created_by_user_id == current_user.id if quiz.created_by_user_id else False
    except AttributeError:
        is_owner = False
    
    if not is_owner:
        raise HTTPException(status_code=403, detail="You can only edit quizzes you created")
    
    # Verify question exists and belongs to this quiz
    question = db.query(QuizQuestion).filter(
        QuizQuestion.id == question_id,
        QuizQuestion.topic_id == topic_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Validate right_option
    right_option_str = str(question_data.right_option)
    if right_option_str not in [str(i) for i in range(len(question_data.options))]:
        raise HTTPException(
            status_code=400,
            detail=f"right_option must be between 0 and {len(question_data.options) - 1}"
        )
    
    # Update question
    question.question = question_data.question
    question.options = question_data.options
    question.right_option = right_option_str
    
    db.commit()
    db.refresh(question)
    
    return JSONResponse(
        content={
            "id": question.id,
            "question": question.question,
            "options": question.options,
            "right_option": question.right_option,
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.post("/quiz/{topic_id}/question", tags=["Quiz"])
async def add_quiz_question(
    topic_id: int,
    question_data: QuestionCreate,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Add a new question to a quiz"""
    # Verify quiz exists and user owns it
    quiz = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check ownership
    try:
        is_owner = quiz.created_by_user_id == current_user.id if quiz.created_by_user_id else False
    except AttributeError:
        is_owner = False
    
    if not is_owner:
        raise HTTPException(status_code=403, detail="You can only edit quizzes you created")
    
    # Validate right_option
    right_option_str = str(question_data.right_option)
    if right_option_str not in [str(i) for i in range(len(question_data.options))]:
        raise HTTPException(
            status_code=400,
            detail=f"right_option must be between 0 and {len(question_data.options) - 1}"
        )
    
    # Create new question
    new_question = QuizQuestion(
        question=question_data.question,
        options=question_data.options,
        right_option=right_option_str,
        topic_id=topic_id
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    return JSONResponse(
        content={
            "id": new_question.id,
            "question": new_question.question,
            "options": new_question.options,
            "right_option": new_question.right_option,
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.delete("/quiz/{topic_id}/question/{question_id}", tags=["Quiz"])
async def delete_quiz_question(
    topic_id: int,
    question_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Delete a question from a quiz"""
    # Verify quiz exists and user owns it
    quiz = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check ownership
    try:
        is_owner = quiz.created_by_user_id == current_user.id if quiz.created_by_user_id else False
    except AttributeError:
        is_owner = False
    
    if not is_owner:
        raise HTTPException(status_code=403, detail="You can only edit quizzes you created")
    
    # Verify question exists and belongs to this quiz
    question = db.query(QuizQuestion).filter(
        QuizQuestion.id == question_id,
        QuizQuestion.topic_id == topic_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Don't allow deleting if it's the only question
    question_count = db.query(QuizQuestion).filter(QuizQuestion.topic_id == topic_id).count()
    if question_count <= 1:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the last question. A quiz must have at least one question."
        )
    
    db.delete(question)
    db.commit()
    
    return JSONResponse(
        content={"message": "Question deleted successfully"},
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/quiz/{topic_id}/shared-results", tags=["Quiz"])
async def get_shared_quiz_results(
    topic_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get all shared quiz results for a quiz (only accessible by creator)"""
    # Verify quiz exists and belongs to user
    quiz = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check if user is the creator
    if quiz.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view results for quizzes you created")
    
    # Get all shared quiz attempts
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.topic_id == topic_id,
        QuizAttempt.is_shared_quiz == True
    ).order_by(QuizAttempt.timestamp.desc()).all()
    
    return JSONResponse(
        content={
            "quiz_id": quiz.id,
            "quiz_topic": quiz.topic,
            "share_code": quiz.share_code,
            "total_attempts": len(attempts),
            "attempts": [
                {
                    "id": attempt.id,
                    "participant_name": attempt.participant_name,
                    "timestamp": attempt.timestamp.isoformat(),
                    "score": attempt.score,
                    "total_questions": attempt.total_questions,
                    "percentage_score": round(attempt.percentage_score, 2),
                    "time_taken_seconds": attempt.time_taken_seconds,
                }
                for attempt in attempts
            ]
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )
