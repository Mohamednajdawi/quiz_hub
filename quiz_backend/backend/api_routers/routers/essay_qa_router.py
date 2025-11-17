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

from backend.api_routers.schemas import EssayQARequest, StoreEssayAnswerRequest, StoreEssayAnswersRequest
from backend.database.db import get_db
from backend.database.sqlite_dal import EssayQATopic, EssayQAQuestion
from backend.utils.utils import generate_essay_qa, generate_essay_qa_from_pdf
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.database.sqlite_dal import User as UserModel
from backend.utils.credits import consume_generation_token

router = APIRouter()


@router.post("/generate-essay-qa", tags=["EssayQA"])
async def create_essay_qa(
    request: EssayQARequest,
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

        essay_qa_data = generate_essay_qa(url, request.num_questions, request.difficulty)

        # Store Essay QA in database
        try:
            # Try to create with difficulty first
            essay_qa_topic = EssayQATopic(
                topic=essay_qa_data["topic"],
                category=essay_qa_data["category"],
                subcategory=essay_qa_data["subcategory"],
                difficulty=request.difficulty,  # Store the difficulty level
                creation_timestamp=datetime.datetime.now(),
                created_by_user_id=current_user.id,
            )
            db.add(essay_qa_topic)
            db.flush()  # Get the ID of the newly created topic
        except Exception as e:
            # Fallback: create without difficulty if column doesn't exist
            logging.warning(f"Creating essay topic without difficulty column: {e}")
            db.rollback()  # Rollback the failed transaction
            
            # Create without difficulty field
            essay_qa_topic = EssayQATopic(
                topic=essay_qa_data["topic"],
                category=essay_qa_data["category"],
                subcategory=essay_qa_data["subcategory"],
                creation_timestamp=datetime.datetime.now(),
                created_by_user_id=current_user.id,
            )
            db.add(essay_qa_topic)
            db.flush()  # Get the ID of the newly created topic

        # Add questions
        for q in essay_qa_data["questions"]:
            essay_qa_question = EssayQAQuestion(
                question=q["question"],
                full_answer=q["full_answer"],
                key_info=q["key_info"],
                topic_id=essay_qa_topic.id,
            )
            db.add(essay_qa_question)

        consume_generation_token(db, current_user)
        db.commit()
        return JSONResponse(
            content=essay_qa_data,
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


@router.post("/generate-essay-qa-from-pdf", tags=["EssayQA"])
async def create_essay_qa_from_pdf(
    pdf_file: UploadFile = File(None),  # Make optional when content_id is provided
    num_questions: int = Form(3),
    difficulty: str = Form("medium"),
    project_id: Optional[int] = Form(None),  # Optional project ID
    content_id: Optional[int] = Form(None),  # Optional content ID
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
            logging.warning(f"[ESSAY QA] Using stored PDF from content_id {content_id}: {temp_file_path}")
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
            # Generate Essay QA from the PDF
            essay_qa_data = generate_essay_qa_from_pdf(temp_file_path, num_questions, difficulty)
            
            # Store Essay QA in database
            try:
                # Try to create with difficulty first
                essay_qa_topic = EssayQATopic(
                    topic=essay_qa_data["topic"],
                    category=essay_qa_data["category"],
                    subcategory=essay_qa_data["subcategory"],
                    difficulty=difficulty,  # Store the difficulty level
                    creation_timestamp=datetime.datetime.now(),
                    created_by_user_id=current_user.id,
                )
                db.add(essay_qa_topic)
                db.flush()  # Get the ID of the newly created topic
            except Exception as e:
                # Fallback: create without difficulty if column doesn't exist
                logging.warning(f"Creating essay topic without difficulty column: {e}")
                db.rollback()  # Rollback the failed transaction
                
                # Create without difficulty field
                essay_qa_topic = EssayQATopic(
                    topic=essay_qa_data["topic"],
                    category=essay_qa_data["category"],
                    subcategory=essay_qa_data["subcategory"],
                    creation_timestamp=datetime.datetime.now(),
                    created_by_user_id=current_user.id,
                )
                db.add(essay_qa_topic)
                db.flush()  # Get the ID of the newly created topic

            # Add questions
            for q in essay_qa_data["questions"]:
                essay_qa_question = EssayQAQuestion(
                    question=q["question"],
                    full_answer=q["full_answer"],
                    key_info=q["key_info"],
                    topic_id=essay_qa_topic.id,
                )
                db.add(essay_qa_question)

            # If project_id is provided, create a reference
            logging.warning(f"[ESSAY] project_id: {project_id}, content_id: {content_id}, essay_topic_id: {essay_qa_topic.id}")
            if project_id is not None:
                from backend.database.sqlite_dal import StudentProjectEssayReference
                essay_reference = StudentProjectEssayReference(
                    project_id=project_id,
                    content_id=content_id,  # Add content_id
                    essay_topic_id=essay_qa_topic.id,
                    created_at=datetime.datetime.now()
                )
                db.add(essay_reference)
                logging.warning(f"[ESSAY] Created reference: project_id={project_id}, content_id={content_id}, essay_topic_id={essay_qa_topic.id}")
            else:
                logging.warning(f"[ESSAY] No project_id provided, skipping reference creation")

            consume_generation_token(db, current_user)
            db.commit()
            return JSONResponse(
                content=essay_qa_data,
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


@router.get("/essay-qa-topics/my", tags=["EssayQA"])
async def get_my_essay_qa_topics(
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get essay QA topics for the current authenticated user (from projects + all recent)"""
    from backend.database.sqlite_dal import (
        StudentProject,
        StudentProjectEssayReference,
        EssayAnswer,
        EssayQATopic,
    )
    
    user_id = current_user.id
    logging.warning(f"[ESSAY] Fetching user essays for user: {user_id}")
    
    essay_topic_ids = set()
    
    # 1. Get essays from user's projects
    user_projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).all()
    project_ids = [project.id for project in user_projects]
    
    if project_ids:
        essay_references = db.query(StudentProjectEssayReference).filter(
            StudentProjectEssayReference.project_id.in_(project_ids)
        ).all()
        essay_topic_ids.update([ref.essay_topic_id for ref in essay_references])
    
    # 2. Get essays the user has answered (directly generated essays)
    essay_answers = db.query(EssayAnswer).filter(EssayAnswer.user_id == user_id).all()
    essay_topic_ids.update([answer.essay_topic_id for answer in essay_answers])
    
    # 3. Include essays generated directly by the user
    direct_topics = db.query(EssayQATopic).filter(EssayQATopic.created_by_user_id == user_id).all()
    essay_topic_ids.update([topic.id for topic in direct_topics])
    
    if not essay_topic_ids:
        logging.warning(f"[ESSAY] No essays found for user: {user_id}")
        return JSONResponse(
            content={"topics": []},
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    
    # Get the essay topics
    topics = db.query(EssayQATopic).filter(EssayQATopic.id.in_(essay_topic_ids)).order_by(EssayQATopic.creation_timestamp.desc()).all()
    
    logging.warning(f"[ESSAY] Found {len(topics)} essays for user: {user_id}")
    
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


@router.get("/essay-qa-topics", tags=["EssayQA"])
async def get_all_essay_qa_topics(db: Session = Depends(get_db)) -> JSONResponse:
    """Get all Essay QA topics"""
    topics = db.query(EssayQATopic).order_by(EssayQATopic.creation_timestamp.desc()).all()
    
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
    

@router.get("/essay-qa/{topic_id}", tags=["EssayQA"])
async def get_essay_qa(topic_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """Get a specific Essay QA by topic ID"""
    topic = db.query(EssayQATopic).filter(EssayQATopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Essay QA topic not found")

    questions = db.query(EssayQAQuestion).filter(EssayQAQuestion.topic_id == topic_id).all()
    return JSONResponse(
        content={
            "id": topic_id,
            "topic": topic.topic,
            "category": topic.category,
            "subcategory": topic.subcategory,
            "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
            "questions": [
                {
                    "question": q.question,
                    "full_answer": q.full_answer,
                    "key_info": q.key_info,
                }
                for q in questions
            ],
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.post("/store-essay-answer", tags=["EssayQA"])
async def store_essay_answer(
    request: StoreEssayAnswerRequest,
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Store user's essay answer and generate AI feedback and score"""
    try:
        from backend.database.sqlite_dal import EssayAnswer, EssayQAQuestion, EssayQATopic
        from backend.utils.feedback import generate_essay_feedback
        
        # Extract fields from request
        essay_id = request.essay_id
        user_id = request.user_id
        question_index = request.question_index
        user_answer = request.user_answer
        timestamp = request.timestamp
        
        # Get the essay topic and question to provide context for feedback
        topic = db.query(EssayQATopic).filter(EssayQATopic.id == essay_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Essay topic not found")
        
        question = db.query(EssayQAQuestion).filter(
            EssayQAQuestion.topic_id == essay_id
        ).order_by(EssayQAQuestion.id).offset(question_index).first()
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Create essay answer record
        essay_answer = EssayAnswer(
            essay_topic_id=essay_id,
            user_id=user_id,
            question_index=question_index,
            user_answer=user_answer,
            timestamp=datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00')),
        )
        
        db.add(essay_answer)
        db.flush()  # Get the ID without committing
        
        # Generate AI feedback and score
        ai_feedback: Optional[str] = None
        score: Optional[float] = None
        
        if user_answer.strip():  # Only generate feedback if answer is not empty
            try:
                key_info = question.key_info if isinstance(question.key_info, list) else []
                feedback, score_value = generate_essay_feedback(
                    question=question.question,
                    user_answer=user_answer,
                    correct_answer=question.full_answer,
                    key_info=key_info,
                )
                ai_feedback = feedback
                score = score_value
                
                if ai_feedback:
                    essay_answer.ai_feedback = ai_feedback
                if score is not None:
                    essay_answer.score = score
            except Exception as feedback_error:  # pylint: disable=broad-except
                logging.error("[ESSAY FEEDBACK] Failed to generate feedback: %s", feedback_error)
                # Continue without feedback - answer is still saved
        
        db.commit()
        db.refresh(essay_answer)
        
        return JSONResponse(
            content={
                "message": "Essay answer stored successfully",
                "answer_id": essay_answer.id,
                "ai_feedback": essay_answer.ai_feedback,
                "score": essay_answer.score,
            },
            status_code=201,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error("[ESSAY ANSWER] Error storing essay answer: %s", e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/store-essay-answers", tags=["EssayQA"])
async def store_essay_answers(
    request: StoreEssayAnswersRequest,
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Store all user's essay answers and generate one combined AI feedback and score"""
    try:
        from backend.database.sqlite_dal import EssayAnswer, EssayQAQuestion, EssayQATopic
        from backend.utils.feedback import generate_combined_essay_feedback
        
        # Extract fields from request
        essay_id = request.essay_id
        user_id = request.user_id
        answers = request.answers
        timestamp = request.timestamp
        
        # Get the essay topic
        topic = db.query(EssayQATopic).filter(EssayQATopic.id == essay_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Essay topic not found")
        
        # Get all questions for this essay
        all_questions = db.query(EssayQAQuestion).filter(
            EssayQAQuestion.topic_id == essay_id
        ).order_by(EssayQAQuestion.id).all()
        
        if not all_questions:
            raise HTTPException(status_code=404, detail="No questions found for this essay")
        
        # Store all individual answers
        stored_answers = []
        questions_and_answers_for_feedback = []
        
        for answer_data in answers:
            question_index = answer_data.get("question_index")
            user_answer = answer_data.get("user_answer", "")
            
            if question_index is None or question_index < 0 or question_index >= len(all_questions):
                continue
            
            question = all_questions[question_index]
            
            # Store individual answer
            essay_answer = EssayAnswer(
                essay_topic_id=essay_id,
                user_id=user_id,
                question_index=question_index,
                user_answer=user_answer,
                timestamp=datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00')),
            )
            db.add(essay_answer)
            stored_answers.append(essay_answer)
            
            # Prepare data for combined feedback
            key_info = question.key_info if isinstance(question.key_info, list) else []
            questions_and_answers_for_feedback.append({
                "question": question.question,
                "user_answer": user_answer,
                "correct_answer": question.full_answer,
                "key_info": key_info,
            })
        
        db.flush()  # Get IDs without committing
        
        # Generate combined AI feedback and score
        ai_feedback: Optional[str] = None
        score: Optional[float] = None
        
        if questions_and_answers_for_feedback and any(qa.get("user_answer", "").strip() for qa in questions_and_answers_for_feedback):
            try:
                feedback, score_value = generate_combined_essay_feedback(
                    questions_and_answers=questions_and_answers_for_feedback,
                )
                ai_feedback = feedback
                score = score_value
                
                # Store combined feedback/score in a special record with question_index=-1
                combined_answer = EssayAnswer(
                    essay_topic_id=essay_id,
                    user_id=user_id,
                    question_index=-1,  # Special index for combined feedback
                    user_answer="",  # Empty since this is just for feedback storage
                    timestamp=datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00')),
                    ai_feedback=ai_feedback,
                    score=score,
                )
                db.add(combined_answer)
            except Exception as feedback_error:  # pylint: disable=broad-except
                logging.error("[ESSAY FEEDBACK] Failed to generate combined feedback: %s", feedback_error)
                # Continue without feedback - answers are still saved
        
        db.commit()
        
        return JSONResponse(
            content={
                "message": "Essay answers stored successfully",
                "total_answers": len(stored_answers),
                "ai_feedback": ai_feedback,
                "score": score,
            },
            status_code=201,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error("[ESSAY ANSWERS] Error storing essay answers: %s", e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/essay-answers/{user_id}", tags=["EssayQA"])
async def get_user_essay_answers(user_id: str, db: Session = Depends(get_db)) -> JSONResponse:
    """Get all essay answers for a specific user with feedback and scores"""
    from backend.database.sqlite_dal import EssayAnswer, EssayQATopic, EssayQAQuestion
    
    # Get all essay answers for the user, excluding individual question answers (only get combined feedback)
    # We'll group by essay_topic_id and get the combined feedback (question_index=-1)
    answers = db.query(EssayAnswer).filter(
        EssayAnswer.user_id == user_id,
        EssayAnswer.question_index == -1  # Only get combined feedback records
    ).order_by(EssayAnswer.timestamp.desc()).all()
    
    # Get topic details for each answer
    answers_with_details = []
    for answer in answers:
        topic = db.query(EssayQATopic).filter(EssayQATopic.id == answer.essay_topic_id).first()
        if not topic:
            continue
        
        # Get all questions for this essay to show question count
        questions = db.query(EssayQAQuestion).filter(
            EssayQAQuestion.topic_id == answer.essay_topic_id
        ).all()
        
        answers_with_details.append({
            "id": answer.id,
            "essay_topic_id": answer.essay_topic_id,
            "topic": topic.topic,
            "category": topic.category,
            "subcategory": topic.subcategory,
            "question_index": -1,  # Combined feedback
            "question": f"Complete essay set ({len(questions)} questions)",
            "user_answer": "",  # Not showing individual answers in list
            "timestamp": answer.timestamp.isoformat() if answer.timestamp else None,
            "ai_feedback": answer.ai_feedback,
            "score": answer.score,
        })
    
    return JSONResponse(
        content={
            "user_id": user_id,
            "answers": answers_with_details,
            "total_answers": len(answers_with_details),
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )
