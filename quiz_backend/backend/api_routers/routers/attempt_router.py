import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional
import datetime

from backend.api_routers.schemas import QuizAttemptRequest, QuizAttemptResultRequest
from backend.database.db import get_db
from backend.database.sqlite_dal import (
    FlashcardTopic,
    QuizAttempt,
    QuizQuestion,
    QuizTopic,
    StudentProject,
    StudentProjectContent,
    StudentProjectQuizReference,
    User,
)
from backend.utils.feedback import generate_quiz_feedback
from backend.components.custom_components import PDFTextExtractor

router = APIRouter()


def _retrieve_source_material_for_quiz(
    db: Session,
    topic_id: int,
) -> Optional[str]:
    """
    Retrieve source material text for a quiz topic.
    
    Tries to find the source material by:
    1. Looking for StudentProjectQuizReference linking to StudentProjectContent
    2. Extracting text from the PDF file if it exists
    
    Args:
        db: Database session
        topic_id: Quiz topic ID
        
    Returns:
        Source material text if found, None otherwise
    """
    try:
        # Try to find the quiz reference to a student project content
        quiz_ref = (
            db.query(StudentProjectQuizReference)
            .filter(StudentProjectQuizReference.quiz_topic_id == topic_id)
            .first()
        )
        
        if not quiz_ref:
            return None
        
        # Get the content
        content = (
            db.query(StudentProjectContent)
            .filter(StudentProjectContent.id == quiz_ref.content_id)
            .first()
        )
        
        if not content:
            return None
        
        # If it's a PDF, extract text
        if content.content_type == "pdf" and content.content_url:
            import os
            if os.path.exists(content.content_url):
                try:
                    extractor = PDFTextExtractor()
                    extraction_result = extractor.run(file_path=content.content_url)
                    extracted_text = extraction_result.get("text", "")
                    if extracted_text.strip():
                        return extracted_text
                except Exception as extract_error:
                    logging.warning(
                        "[FEEDBACK] Failed to extract text from PDF %s: %s",
                        content.content_url,
                        extract_error
                    )
        
        # If it's text content, return it directly
        if content.content_text:
            return content.content_text
        
        return None
    except Exception as e:
        logging.warning("[FEEDBACK] Error retrieving source material: %s", e)
        return None


def _normalize_answer_index(raw_value, options_length: int) -> Optional[int]:
    if raw_value is None:
        return None

    if isinstance(raw_value, str):
        stripped = raw_value.strip().lower()
        if not stripped:
            return None
        if stripped.isdigit():
            idx = int(stripped)
        elif len(stripped) == 1 and "a" <= stripped <= "z":
            idx = ord(stripped) - 97
        else:
            try:
                idx = int(float(stripped))
            except ValueError:
                return None
    else:
        idx = int(raw_value)

    if options_length <= 0:
        return idx

    return idx if 0 <= idx < options_length else None


def _format_option_text(options: Optional[list], index: Optional[int]) -> Optional[str]:
    if index is None:
        return None
    if options and 0 <= index < len(options):
        return options[index]
    # Fall back to generic label
    return f"Option {index + 1}"


def _collect_question_details_for_feedback(
    *,
    topic_id: int,
    user_answers: List[int],
    correct_answers: List[int],
    db: Session,
) -> List[Dict[str, Any]]:
    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.topic_id == topic_id)
        .order_by(QuizQuestion.id.asc())
        .all()
    )

    if not questions:
        # If we have no stored questions (e.g., ad-hoc quizzes), still build a minimal structure
        details = []
        for idx, (user_raw, correct_raw) in enumerate(zip(user_answers, correct_answers), start=1):
            user_idx = _normalize_answer_index(user_raw, 0)
            correct_idx = _normalize_answer_index(correct_raw, 0)
            details.append(
                {
                    "number": idx,
                    "question": f"Question {idx}",
                    "user_answer": f"Option {user_idx + 1}" if user_idx is not None else "Not answered",
                    "correct_answer": f"Option {correct_idx + 1}" if correct_idx is not None else "Unknown",
                    "is_correct": user_idx is not None and user_idx == correct_idx,
                }
            )
        return details

    details: List[Dict[str, Any]] = []
    max_len = min(len(questions), max(len(user_answers), len(correct_answers)))

    for idx in range(max_len):
        question = questions[idx]
        user_raw = user_answers[idx] if idx < len(user_answers) else None
        correct_raw = correct_answers[idx] if idx < len(correct_answers) else None

        user_idx = _normalize_answer_index(user_raw, len(question.options or []))
        correct_idx = _normalize_answer_index(correct_raw, len(question.options or []))

        user_text = _format_option_text(question.options, user_idx)
        correct_text = _format_option_text(question.options, correct_idx)

        concept_name = ""

        details.append(
            {
                "number": idx + 1,
                "question": question.question,
                "user_answer": user_text if user_text else "Not answered",
                "correct_answer": correct_text if correct_text else "Unknown",
                "is_correct": user_idx is not None and user_idx == correct_idx,
                "concept": concept_name,
            }
        )

    return details


@router.post("/record-quiz-attempt", tags=["Attempts"])
async def record_quiz_attempt(request: QuizAttemptRequest, db: Session = Depends(get_db)) -> JSONResponse:
    """Record when a quiz is taken (legacy endpoint for backward compatibility)"""
    # Verify the topic exists
    topic = db.query(QuizTopic).filter(QuizTopic.id == request.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Quiz topic not found")
    
    # Record the attempt
    quiz_attempt = QuizAttempt(topic_id=request.topic_id)
    db.add(quiz_attempt)
    db.commit()
    
    return JSONResponse(
        content={"message": "Quiz attempt recorded successfully", "timestamp": quiz_attempt.timestamp.isoformat()},
        status_code=201
    )


@router.post("/record-quiz-result", tags=["Attempts"])
async def record_quiz_result(request: QuizAttemptResultRequest, db: Session = Depends(get_db)) -> JSONResponse:
    """Record detailed quiz attempt with results"""
    topic: Optional[QuizTopic] = None

    # Handle URL/PDF quizzes (topic_id 999)
    if request.topic_id == 999:
        # Create or get the special topic for URL/PDF quizzes
        url_pdf_topic = db.query(QuizTopic).filter(QuizTopic.id == 999).first()
        if not url_pdf_topic:
            url_pdf_topic = QuizTopic(
                id=999,
                topic="URL/PDF Generated Quizzes",
                category="Generated Content",
                subcategory="Dynamic Quizzes",
                creation_timestamp=datetime.datetime.now()
            )
            db.add(url_pdf_topic)
            db.commit()
            db.refresh(url_pdf_topic)
    else:
        # Verify the topic exists for regular quizzes
        topic = db.query(QuizTopic).filter(QuizTopic.id == request.topic_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Quiz topic not found")
    
    # Verify user exists if provided, or create anonymous attempt
    user = None
    if request.user_id:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            # Create a new user with the provided Firebase UID
            user = User(
                id=request.user_id,
                email=f"user_{request.user_id}@example.com",  # Placeholder email
                firebase_uid=request.user_id,  # Store the Firebase UID
                is_active=True,
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    
    # Calculate percentage score
    percentage_score = (request.score / request.total_questions) * 100 if request.total_questions > 0 else 0
    
    # Create detailed quiz attempt
    quiz_attempt = QuizAttempt(
        user_id=request.user_id,
        topic_id=request.topic_id,
        score=request.score,
        total_questions=request.total_questions,
        time_taken_seconds=request.time_taken_seconds,
        percentage_score=percentage_score,
        user_answers=request.user_answers,
        correct_answers=request.correct_answers,
        difficulty_level=request.difficulty_level,
        source_type=request.source_type,
        source_info=request.source_info,
        question_performance=request.question_performance
    )
    
    db.add(quiz_attempt)
    db.commit()
    db.refresh(quiz_attempt)

    # Determine topic name for feedback context
    topic_name = topic.topic if topic else request.source_info or "URL/PDF Quiz"

    # Retrieve source material if available
    source_material = _retrieve_source_material_for_quiz(db, request.topic_id)

    # Generate AI feedback if possible
    ai_feedback: Optional[str] = None
    try:
        question_details = _collect_question_details_for_feedback(
            topic_id=request.topic_id,
            user_answers=request.user_answers,
            correct_answers=request.correct_answers,
            db=db,
        )
        ai_feedback = generate_quiz_feedback(
            topic_name=topic_name,
            score=request.score,
            total_questions=request.total_questions,
            percentage=quiz_attempt.percentage_score,
            time_taken_seconds=request.time_taken_seconds,
            question_details=question_details,
            source_material=source_material,
        )
    except Exception as feedback_error:  # pylint: disable=broad-except
        logging.error("[QUIZ FEEDBACK] Failed to prepare feedback context: %s", feedback_error)

    if ai_feedback:
        quiz_attempt.ai_feedback = ai_feedback
        db.add(quiz_attempt)
        db.commit()
        db.refresh(quiz_attempt)

    return JSONResponse(
        content={
            "message": "Quiz result recorded successfully",
            "attempt_id": quiz_attempt.id,
            "timestamp": quiz_attempt.timestamp.isoformat(),
            "score": quiz_attempt.score,
            "percentage": quiz_attempt.percentage_score,
            "ai_feedback": quiz_attempt.ai_feedback,
        },
        status_code=201
    )


@router.get("/quiz-attempts/{topic_id}", tags=["Attempts"])
async def get_quiz_attempts(topic_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """Get all attempts for a specific quiz topic (legacy endpoint)"""
    # Verify the topic exists
    topic = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Quiz topic not found")
    
    # Get all attempts
    attempts = db.query(QuizAttempt).filter(QuizAttempt.topic_id == topic_id).all()
    
    return JSONResponse(
        content={
            "topic": topic.topic,
            "attempts": [attempt.timestamp.isoformat() for attempt in attempts]
        }
    )


@router.get("/quiz-attempts/{topic_id}/detailed", tags=["Attempts"])
async def get_detailed_quiz_attempts(topic_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """Get detailed attempts for a specific quiz topic"""
    # Verify the topic exists
    topic = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Quiz topic not found")
    
    # Get all detailed attempts
    attempts = db.query(QuizAttempt).filter(QuizAttempt.topic_id == topic_id).order_by(QuizAttempt.timestamp.desc()).all()
    
    return JSONResponse(
        content={
            "topic": topic.topic,
            "category": topic.category,
            "subcategory": topic.subcategory,
            "attempts": [
                {
                    "id": attempt.id,
                    "user_id": attempt.user_id,
                    "timestamp": attempt.timestamp.isoformat(),
                    "score": attempt.score,
                    "total_questions": attempt.total_questions,
                    "percentage_score": attempt.percentage_score,
                    "time_taken_seconds": attempt.time_taken_seconds,
                    "difficulty_level": attempt.difficulty_level,
                    "source_type": attempt.source_type,
                    "source_info": attempt.source_info,
                    "ai_feedback": attempt.ai_feedback,
                }
                for attempt in attempts
            ]
        }
    )


@router.get("/user-quiz-history/{user_id}", tags=["Attempts"])
async def get_user_quiz_history(user_id: str, db: Session = Depends(get_db)) -> JSONResponse:
    """Get detailed quiz history for a specific user"""
    logging.warning(f"[QUIZ HISTORY] Fetching for user_id: {user_id}")
    # Check if user exists, if not create them
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logging.warning(f"[QUIZ HISTORY] User not found, creating new user: {user_id}")
        user = User(
            id=user_id,
            email=f"user_{user_id}@example.com",  # Placeholder email
            firebase_uid=user_id,  # Store the Firebase UID
            is_active=True,
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Get all attempts for the user
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).order_by(QuizAttempt.timestamp.desc()).all()
    logging.warning(f"[QUIZ HISTORY] Found {len(attempts)} attempts for user_id: {user_id}")
    
    # Calculate statistics
    total_attempts = len(attempts)
    total_time_spent = sum(attempt.time_taken_seconds for attempt in attempts)
    average_score = sum(attempt.percentage_score for attempt in attempts) / total_attempts if total_attempts > 0 else 0
    best_score = max(attempt.percentage_score for attempt in attempts) if attempts else 0
    
    # Get topic details for each attempt
    attempts_with_topics = []
    for attempt in attempts:
        if attempt.topic_id == 999:
            # Handle URL/PDF quizzes
            topic_name = attempt.source_info if attempt.source_info else "URL/PDF Quiz"
            category = "Generated Content"
            subcategory = attempt.source_type if attempt.source_type else "Quiz"
        else:
            # Handle regular quizzes
            topic = db.query(QuizTopic).filter(QuizTopic.id == attempt.topic_id).first()
            if topic:
                topic_name = topic.topic
                category = topic.category
                subcategory = topic.subcategory
            else:
                topic_name = "Unknown Topic"
                category = "Unknown Category"
                subcategory = "Unknown Subcategory"
        
        attempts_with_topics.append({
            "id": attempt.id,
            "topic_id": attempt.topic_id,
            "topic_name": topic_name,
            "category": category,
            "subcategory": subcategory,
            "timestamp": attempt.timestamp.isoformat(),
            "score": attempt.score,
            "total_questions": attempt.total_questions,
            "percentage_score": attempt.percentage_score,
            "time_taken_seconds": attempt.time_taken_seconds,
            "difficulty_level": attempt.difficulty_level,
            "source_type": attempt.source_type,
            "ai_feedback": attempt.ai_feedback,
        })
    logging.warning(f"[QUIZ HISTORY] Returning {len(attempts_with_topics)} attempts for user_id: {user_id}")
    return JSONResponse(
        content={
            "user_id": user_id,
            "attempts": attempts_with_topics,
            "total_attempts": total_attempts,
            "average_score": round(average_score, 2),
            "best_score": round(best_score, 2),
            "total_time_spent": total_time_spent
        }
    )


@router.get("/quiz-attempt/{attempt_id}", tags=["Attempts"])
async def get_quiz_attempt_details(attempt_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """Get detailed information about a specific quiz attempt"""
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    
    # Get topic details
    topic = db.query(QuizTopic).filter(QuizTopic.id == attempt.topic_id).first()
    
    return JSONResponse(
        content={
            "id": attempt.id,
            "user_id": attempt.user_id,
            "topic_id": attempt.topic_id,
            "topic_name": topic.topic if topic else "Unknown Topic",
            "category": topic.category if topic else "Unknown Category",
            "subcategory": topic.subcategory if topic else "Unknown Subcategory",
            "timestamp": attempt.timestamp.isoformat(),
            "score": attempt.score,
            "total_questions": attempt.total_questions,
            "percentage_score": attempt.percentage_score,
            "time_taken_seconds": attempt.time_taken_seconds,
            "user_answers": attempt.user_answers,
            "correct_answers": attempt.correct_answers,
            "difficulty_level": attempt.difficulty_level,
            "source_type": attempt.source_type,
            "source_info": attempt.source_info,
            "question_performance": attempt.question_performance,
            "ai_feedback": attempt.ai_feedback,
        }
    )


@router.get("/quiz-statistics/{topic_id}", tags=["Attempts"])
async def get_quiz_statistics(topic_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """Get statistics for a specific quiz topic"""
    # Verify the topic exists
    topic = db.query(QuizTopic).filter(QuizTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Quiz topic not found")
    
    # Get all attempts for this topic
    attempts = db.query(QuizAttempt).filter(QuizAttempt.topic_id == topic_id).all()
    
    if not attempts:
        return JSONResponse(
            content={
                "topic": topic.topic,
                "total_attempts": 0,
                "average_score": 0,
                "best_score": 0,
                "average_time": 0,
                "total_time_spent": 0
            }
        )
    
    # Calculate statistics
    total_attempts = len(attempts)
    average_score = sum(attempt.percentage_score for attempt in attempts) / total_attempts
    best_score = max(attempt.percentage_score for attempt in attempts)
    average_time = sum(attempt.time_taken_seconds for attempt in attempts) / total_attempts
    total_time_spent = sum(attempt.time_taken_seconds for attempt in attempts)
    
    return JSONResponse(
        content={
            "topic": topic.topic,
            "category": topic.category,
            "subcategory": topic.subcategory,
            "total_attempts": total_attempts,
            "average_score": round(average_score, 2),
            "best_score": round(best_score, 2),
            "average_time": round(average_time, 2),
            "total_time_spent": total_time_spent
        }
    )


@router.get("/user-analytics/{user_id}", tags=["Analytics"])
async def get_user_analytics(user_id: str, db: Session = Depends(get_db)) -> JSONResponse:
    """Get comprehensive analytics for a specific user"""
    logging.warning(f"[ANALYTICS] Fetching analytics for user_id: {user_id}")
    
    # Check if user exists, if not create them
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logging.warning(f"[ANALYTICS] User not found, creating new user: {user_id}")
        user = User(
            id=user_id,
            email=f"user_{user_id}@example.com",  # Placeholder email
            firebase_uid=user_id,  # Store the Firebase UID
            is_active=True,
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Gather resource usage stats regardless of attempts
    total_projects = (
        db.query(StudentProject)
        .filter(StudentProject.user_id == user_id)
        .count()
    )
    total_uploaded_pdfs = (
        db.query(StudentProjectContent)
        .join(
            StudentProject,
            StudentProjectContent.project_id == StudentProject.id,
        )
        .filter(
            StudentProject.user_id == user_id,
            StudentProjectContent.content_type == "pdf",
        )
        .count()
    )
    total_flashcard_topics = (
        db.query(FlashcardTopic)
        .filter(FlashcardTopic.created_by_user_id == user_id)
        .count()
    )

    # Get all attempts for the user
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).order_by(QuizAttempt.timestamp.desc()).all()
    logging.warning(f"[ANALYTICS] Found {len(attempts)} attempts for user_id: {user_id}")
    
    if not attempts:
        return JSONResponse(
            content={
                "user_id": user_id,
                "total_quizzes": 0,
                "average_score": 0,
                "best_score": 0,
                "total_time_spent": 0,
                "category_attempts": {},
                "category_accuracy": {},
                "scores": [],
                "recent_history": [],
                "improvement_trend": "N/A",
                "strengths": [],
                "weaknesses": [],
                "total_projects": total_projects,
                "total_uploaded_pdfs": total_uploaded_pdfs,
                "total_flashcard_topics": total_flashcard_topics,
            }
        )
    
    # Calculate basic statistics
    total_quizzes = len(attempts)
    total_time_spent = sum(attempt.time_taken_seconds for attempt in attempts)
    average_score = sum(attempt.percentage_score for attempt in attempts) / total_quizzes
    best_score = max(attempt.percentage_score for attempt in attempts)
    
    # Get topic details and calculate category statistics
    category_attempts = {}
    category_correct_answers = {}
    category_total_questions = {}
    scores = []
    recent_history = []
    
    # Sort attempts by timestamp (oldest first) for proper trend analysis
    attempts_chronological = sorted(attempts, key=lambda x: x.timestamp)
    
    for attempt in attempts_chronological:
        if attempt.topic_id == 999:
            # Handle URL/PDF quizzes
            category = "Generated Content"
            topic_name = attempt.source_info if attempt.source_info else "URL/PDF Quiz"
        else:
            # Handle regular quizzes
            topic = db.query(QuizTopic).filter(QuizTopic.id == attempt.topic_id).first()
            if topic:
                category = topic.category
                topic_name = topic.topic
            else:
                category = "Unknown Category"
                topic_name = "Unknown Topic"
        
        score_percentage = attempt.percentage_score
        
        # Track category attempts
        category_attempts[category] = category_attempts.get(category, 0) + 1
        
        # Track category accuracy
        category_correct_answers[category] = category_correct_answers.get(category, 0) + attempt.score
        category_total_questions[category] = category_total_questions.get(category, 0) + attempt.total_questions
        
        # Store scores for trend analysis (in chronological order)
        scores.append(score_percentage)
    
    # Get recent history (most recent attempts)
    recent_attempts = sorted(attempts, key=lambda x: x.timestamp, reverse=True)[:5]
    for attempt in recent_attempts:
        if attempt.topic_id == 999:
            # Handle URL/PDF quizzes
            category = "Generated Content"
            topic_name = attempt.source_info if attempt.source_info else "URL/PDF Quiz"
        else:
            # Handle regular quizzes
            topic = db.query(QuizTopic).filter(QuizTopic.id == attempt.topic_id).first()
            if topic:
                category = topic.category
                topic_name = topic.topic
            else:
                category = "Unknown Category"
                topic_name = "Unknown Topic"
        
        recent_history.append({
            "id": attempt.id,
            "topic_id": attempt.topic_id,
            "topic_name": topic_name,
            "category": category,
            "subcategory": attempt.source_type if attempt.source_type else "Quiz",
            "timestamp": attempt.timestamp.isoformat(),
            "score": attempt.score,
            "total_questions": attempt.total_questions,
            "percentage_score": attempt.percentage_score,
            "time_taken_seconds": attempt.time_taken_seconds,
            "difficulty_level": attempt.difficulty_level,
            "source_type": attempt.source_type,
            "ai_feedback": attempt.ai_feedback,
        })
    
    # Calculate category accuracy
    category_accuracy = {}
    for category in category_attempts.keys():
        correct_answers = category_correct_answers.get(category, 0)
        total_questions = category_total_questions.get(category, 1)
        category_accuracy[category] = correct_answers / total_questions if total_questions > 0 else 0
    
    # Calculate improvement trend
    improvement_trend = "N/A"
    if len(scores) >= 2:
        # Calculate average of first 3 scores vs last 3 scores
        initial_scores_count = min(3, len(scores) // 2)
        recent_scores_count = min(3, len(scores) // 2)
        
        initial_scores = scores[:initial_scores_count]
        recent_scores = scores[-recent_scores_count:]
        
        initial_average = sum(initial_scores) / len(initial_scores)
        recent_average = sum(recent_scores) / len(recent_scores)
        
        improvement = recent_average - initial_average
        if improvement > 0:
            improvement_trend = f"+{round(improvement)}%"
        elif improvement < 0:
            improvement_trend = f"{round(improvement)}%"
        else:
            improvement_trend = "No change"
    
    # Identify strengths and weaknesses
    strengths = []
    weaknesses = []
    for category, accuracy in category_accuracy.items():
        if accuracy >= 0.8:  # 80% or higher
            strengths.append(category)
        elif accuracy < 0.6:  # Below 60%
            weaknesses.append(category)
    
    # Scores are already in chronological order (oldest to newest) for trend analysis
    
    logging.warning(f"[ANALYTICS] Returning analytics for user_id: {user_id}")
    return JSONResponse(
        content={
            "user_id": user_id,
            "total_quizzes": total_quizzes,
            "average_score": round(average_score, 2),
            "best_score": round(best_score, 2),
            "total_time_spent": total_time_spent,
            "category_attempts": category_attempts,
            "category_accuracy": category_accuracy,
            "scores": scores,
            "recent_history": recent_history,
            "improvement_trend": improvement_trend,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "total_projects": total_projects,
            "total_uploaded_pdfs": total_uploaded_pdfs,
            "total_flashcard_topics": total_flashcard_topics,
        }
    ) 