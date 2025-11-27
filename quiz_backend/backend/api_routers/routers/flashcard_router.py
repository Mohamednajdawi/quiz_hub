import os
import shutil
import tempfile
import datetime
import requests
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging

from backend.api_routers.schemas import FlashcardRequest
from backend.database.db import get_db
from backend.database.sqlite_dal import FlashcardTopic, FlashcardCard, TokenUsage
from backend.utils.utils import generate_flashcards, generate_flashcards_from_pdf
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.database.sqlite_dal import User as UserModel
from backend.utils.credits import consume_generation_token
from backend.utils.feedback_context import collect_feedback_context

router = APIRouter()


@router.post("/generate-flashcards", tags=["Flashcards"])
async def create_flashcards(
    request: FlashcardRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user_dependency),
) -> JSONResponse:
    try:
        # Remove trailing slash if present
        url = str(request.url).rstrip("/")

        feedback_context = collect_feedback_context(db, user_id=current_user.id)

        flashcard_data, token_usage = generate_flashcards(
            url,
            num_cards=request.num_cards,
            feedback=feedback_context,
        )

        # Store flashcards in database
        try:
            # Try to create with difficulty first
            flashcard_topic = FlashcardTopic(
                topic=flashcard_data["topic"],
                category=flashcard_data["category"],
                subcategory=flashcard_data["subcategory"],
                difficulty="medium",  # Default difficulty for flashcards
                creation_timestamp=datetime.datetime.now(),
                created_by_user_id=current_user.id,
            )
            db.add(flashcard_topic)
            db.flush()  # Get the ID of the newly created topic
        except Exception as e:
            # Fallback: create without difficulty if column doesn't exist
            logging.warning(f"Creating flashcard topic without difficulty column: {e}")
            db.rollback()  # Rollback the failed transaction
            
            # Create without difficulty field
            flashcard_topic = FlashcardTopic(
                topic=flashcard_data["topic"],
                category=flashcard_data["category"],
                subcategory=flashcard_data["subcategory"],
                creation_timestamp=datetime.datetime.now(),
                created_by_user_id=current_user.id,
            )
            db.add(flashcard_topic)
            db.flush()  # Get the ID of the newly created topic

        # Add cards
        for card in flashcard_data["cards"]:
            flashcard_card = FlashcardCard(
                front=card["front"],
                back=card["back"],
                importance=card.get("importance", "medium"),
                topic_id=flashcard_topic.id,
            )
            db.add(flashcard_card)

        consume_generation_token(db, current_user)
        
        # Store token usage
        token_usage_record = TokenUsage(
            user_id=current_user.id,
            generation_type="flashcard",
            topic_id=flashcard_topic.id,
            input_tokens=token_usage.get("input_tokens", 0),
            output_tokens=token_usage.get("output_tokens", 0),
            total_tokens=token_usage.get("total_tokens", 0),
        )
        db.add(token_usage_record)
        
        db.commit()
        return JSONResponse(
            content=flashcard_data,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            db.rollback()
            raise HTTPException(
                status_code=404, detail=f"Content not found at URL: {request.url}"
            )
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/generate-flashcards-from-pdf", tags=["Flashcards"])
async def create_flashcards_from_pdf(
    pdf_file: UploadFile = File(None),  # Make optional when content_id is provided
    num_cards: int = Form(10),
    project_id: Optional[int] = Form(None),  # Optional project ID
    content_id: Optional[int] = Form(None),  # Optional content ID
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user_dependency),
) -> JSONResponse:
    try:
        temp_file_path = None
        feedback_context = None
        scoped_topic_ids: list[int] = []
        
        # If content_id is provided, use the stored PDF file
        if content_id is not None:
            from backend.database.sqlite_dal import (
                StudentProjectContent,
                StudentProjectQuizReference,
            )
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
            logging.warning(f"[FLASHCARDS] Using stored PDF from content_id {content_id}: {temp_file_path}")

            # Aggregate AI feedback from related quiz attempts to guide flashcard generation
            quiz_query = db.query(StudentProjectQuizReference).filter(
                StudentProjectQuizReference.content_id == content_id
            )
            if project_id is not None:
                quiz_query = quiz_query.filter(
                    StudentProjectQuizReference.project_id == project_id
                )
            associated_quizzes = quiz_query.all()
            scoped_topic_ids = [ref.quiz_topic_id for ref in associated_quizzes if ref.quiz_topic_id]
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
            if not feedback_context:
                feedback_context = collect_feedback_context(
                    db,
                    user_id=current_user.id,
                    quiz_topic_ids=scoped_topic_ids or None,
                )
            if not feedback_context:
                feedback_context = collect_feedback_context(db, user_id=current_user.id)

            # Generate flashcards from the PDF
            flashcard_data, token_usage = generate_flashcards_from_pdf(
                temp_file_path,
                num_cards=num_cards,
                feedback=feedback_context,
            )
            
            # Store flashcards in database
            try:
                flashcard_topic = FlashcardTopic(
                    topic=flashcard_data["topic"],
                    category=flashcard_data["category"],
                    subcategory=flashcard_data["subcategory"],
                    difficulty="medium",  # Default difficulty for flashcards
                    creation_timestamp=datetime.datetime.now(),
                    created_by_user_id=current_user.id,
                )
                db.add(flashcard_topic)
                db.flush()  # Get the ID of the newly created topic
            except Exception as e:
                # Fallback: create without difficulty if column doesn't exist
                logging.warning(f"Creating flashcard topic without difficulty column: {e}")
                db.rollback()
                flashcard_topic = FlashcardTopic(
                    topic=flashcard_data["topic"],
                    category=flashcard_data["category"],
                    subcategory=flashcard_data["subcategory"],
                    creation_timestamp=datetime.datetime.now(),
                    created_by_user_id=current_user.id,
                )
                db.add(flashcard_topic)
                db.flush()  # Get the ID of the newly created topic

            # Add cards
            for card in flashcard_data["cards"]:
                flashcard_card = FlashcardCard(
                    front=card["front"],
                    back=card["back"],
                    importance=card.get("importance", "medium"),
                    topic_id=flashcard_topic.id,
                )
                db.add(flashcard_card)

            # If project_id is provided, create a reference
            logging.warning(f"[FLASHCARDS] project_id: {project_id}, content_id: {content_id}, flashcard_topic_id: {flashcard_topic.id}")
            if project_id is not None:
                from backend.database.sqlite_dal import StudentProjectFlashcardReference
                flashcard_reference = StudentProjectFlashcardReference(
                    project_id=project_id,
                    content_id=content_id,  # Add content_id
                    flashcard_topic_id=flashcard_topic.id,
                    created_at=datetime.datetime.now()
                )
                db.add(flashcard_reference)
                logging.warning(f"[FLASHCARDS] Created reference: project_id={project_id}, content_id={content_id}, flashcard_topic_id={flashcard_topic.id}")
            else:
                logging.warning(f"[FLASHCARDS] No project_id provided, skipping reference creation")

            consume_generation_token(db, current_user)
            
            # Store token usage
            token_usage_record = TokenUsage(
                user_id=current_user.id,
                generation_type="flashcard",
                topic_id=flashcard_topic.id,
                input_tokens=token_usage.get("input_tokens", 0),
                output_tokens=token_usage.get("output_tokens", 0),
                total_tokens=token_usage.get("total_tokens", 0),
            )
            db.add(token_usage_record)
            
            db.commit()
            return JSONResponse(
                content=flashcard_data,
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


@router.get("/flashcard-topics/my", tags=["Flashcards"])
async def get_my_flashcard_topics(
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get flashcard topics for the current authenticated user (from projects + all recent)"""
    from backend.database.sqlite_dal import (
        StudentProject,
        StudentProjectFlashcardReference,
        FlashcardTopic,
    )
    
    user_id = current_user.id
    logging.warning(f"[FLASHCARD] Fetching user flashcards for user: {user_id}")
    
    flashcard_topic_ids = set()
    
    # 1. Get flashcards from user's projects
    user_projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).all()
    project_ids = [project.id for project in user_projects]
    
    if project_ids:
        flashcard_references = db.query(StudentProjectFlashcardReference).filter(
            StudentProjectFlashcardReference.project_id.in_(project_ids)
        ).all()
        flashcard_topic_ids.update([ref.flashcard_topic_id for ref in flashcard_references])
    
    # 2. Get flashcards generated directly by the user
    direct_topics = db.query(FlashcardTopic).filter(FlashcardTopic.created_by_user_id == user_id).all()
    flashcard_topic_ids.update([topic.id for topic in direct_topics])
    
    if not flashcard_topic_ids:
        logging.warning(f"[FLASHCARD] No flashcards found for user: {user_id}")
        return JSONResponse(
            content=[],
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    
    # Get the flashcard topics
    topics = db.query(FlashcardTopic).filter(FlashcardTopic.id.in_(flashcard_topic_ids)).order_by(FlashcardTopic.creation_timestamp.desc()).all()
    
    logging.warning(f"[FLASHCARD] Found {len(topics)} flashcards for user: {user_id}")
    
    return JSONResponse(
        content=[
            {
                "id": topic.id,
                "topic": topic.topic,
                "category": topic.category,
                "subcategory": topic.subcategory,
                "difficulty": topic.difficulty if hasattr(topic, 'difficulty') else None,
                "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
            }
            for topic in topics
        ],
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/flashcard-topics", tags=["Flashcards"])
async def get_flashcard_topics(db: Session = Depends(get_db)) -> JSONResponse:
    """Get all flashcard topics"""
    topics = db.query(FlashcardTopic).all()
    return JSONResponse(
        content=[
            {
                "id": topic.id,
                "topic": topic.topic,
                "category": topic.category,
                "subcategory": topic.subcategory,
                "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
            }
            for topic in topics
        ],
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/flashcards/{topic_id}", tags=["Flashcards"])
async def get_flashcards(topic_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """Get flashcards for a specific topic"""
    topic = db.query(FlashcardTopic).filter(FlashcardTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Flashcard topic not found")

    cards = db.query(FlashcardCard).filter(FlashcardCard.topic_id == topic_id).all()
    return JSONResponse(
        content={
            "topic": topic.topic,
            "category": topic.category,
            "subcategory": topic.subcategory,
            "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
            "cards": [
                {
                    "front": card.front,
                    "back": card.back,
                    "importance": card.importance or "medium",
                }
                for card in cards
            ],
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    ) 