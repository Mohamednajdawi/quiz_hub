import datetime
import logging
import os
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from backend.api_routers.schemas import (
    StudentProjectCreate,
    StudentProjectResponse,
    StudentProjectListResponse,
    StudentProjectContentCreate,
    StudentProjectContentResponse,
    StudentProjectReferenceCreate
)
from backend.database.db import get_db
from backend.database.sqlite_dal import (
    StudentProject, 
    StudentProjectContent, 
    StudentProjectQuizReference,
    StudentProjectFlashcardReference,
    StudentProjectEssayReference,
    StudentProjectMindMapReference,
    User,
    QuizTopic,
    QuizQuestion,
    FlashcardTopic,
    EssayQATopic,
    EssayQAQuestion,
    MindMap,
    Subscription,
    GenerationJob,
)
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.utils.credits import consume_generation_token
from backend.utils.utils import generate_quiz_from_pdf, generate_essay_qa_from_pdf, generate_mind_map_from_pdf
from backend.database.sqlite_dal import User as UserModel
from backend.config.settings import get_app_config, get_pdf_storage_dir
from backend.database.db import SessionLocal
from pydantic import BaseModel
from backend.utils.feedback_context import collect_feedback_context

router = APIRouter()


def get_user_tier(user_id: str, db: Session) -> str:
    """Determine if user is on free tier or pro tier based on active subscription"""
    active_subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == "active"
    ).first()
    
    return "pro_tier" if active_subscription else "free_tier"


def get_max_projects_for_user(user_id: str, db: Session) -> int:
    """Get the maximum number of projects allowed for a user based on their tier"""
    tier = get_user_tier(user_id, db)
    config = get_app_config()
    limits = config.get("limits", {})
    tier_limits = limits.get(tier, {})
    max_projects = tier_limits.get("max_projects", 3)  # Default to 3 if not found
    
    # -1 means unlimited, return a very large number for comparison
    return max_projects if max_projects != -1 else 999999


class QuizGenerationJobRequest(BaseModel):
    num_questions: Optional[int] = None
    difficulty: Optional[str] = "medium"


class EssayGenerationJobRequest(BaseModel):
    num_questions: Optional[int] = None
    difficulty: Optional[str] = "medium"


class MindMapGenerationJobRequest(BaseModel):
    focus: Optional[str] = None
    include_examples: bool = True


class GenerationJobStatusResponse(BaseModel):
    job_id: int
    status: str
    job_type: str
    requested_questions: Optional[int] = None
    difficulty: Optional[str] = None
    result: Optional[dict] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    completed_at: Optional[str] = None


@router.post("/student-projects", tags=["Student Projects"])
async def create_student_project(
    request: StudentProjectCreate,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Create a new student project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Creating project for user: {user_id}")
    
    # Check if user exists, if not create them
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logging.warning(f"[STUDENT PROJECT] User not found, creating new user: {user_id}")
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
    
    # Check project limit
    max_projects = get_max_projects_for_user(user_id, db)
    current_project_count = db.query(StudentProject).filter(StudentProject.user_id == user_id).count()
    
    # Only enforce limit if it's not unlimited (999999 means unlimited)
    if max_projects < 999999 and current_project_count >= max_projects:
        tier = get_user_tier(user_id, db)
        if tier == "free_tier":
            raise HTTPException(
                status_code=403,
                detail=f"You have reached the maximum number of projects ({max_projects}) for the free tier. Please upgrade to Pro for unlimited projects."
            )
        else:
            raise HTTPException(
                status_code=403,
                detail=f"You have reached the maximum number of projects ({max_projects})."
            )
    
    # Create the project
    project = StudentProject(
        user_id=user_id,
        name=request.name,
        description=request.description,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now()
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    logging.warning(f"[STUDENT PROJECT] Project created successfully: {project.id}")
    
    return JSONResponse(
        content={
            "message": "Project created successfully",
            "project_id": project.id,
            "name": project.name,
            "created_at": project.created_at.isoformat()
        },
        status_code=201
    )


@router.get("/student-projects", tags=["Student Projects"])
async def get_student_projects(
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get all projects for the current authenticated user"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Fetching projects for user: {user_id}")
    
    # Check if user exists, if not create them
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logging.warning(f"[STUDENT PROJECT] User not found, creating new user: {user_id}")
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
    
    # Get all projects for the user
    projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).order_by(StudentProject.created_at.desc()).all()
    
    projects_data = []
    for project in projects:
        # Get contents
        contents = db.query(StudentProjectContent).filter(StudentProjectContent.project_id == project.id).all()
        contents_data = [
            {
                "id": content.id,
                "content_type": content.content_type,
                "name": content.name,
                "content_url": content.content_url,
                "content_text": content.content_text,
                "file_size": content.file_size,
                "uploaded_at": content.uploaded_at.isoformat()
            }
            for content in contents
        ]
        
        # Get references
        quiz_refs = db.query(StudentProjectQuizReference).filter(StudentProjectQuizReference.project_id == project.id).all()
        flashcard_refs = db.query(StudentProjectFlashcardReference).filter(StudentProjectFlashcardReference.project_id == project.id).all()
        essay_refs = db.query(StudentProjectEssayReference).filter(StudentProjectEssayReference.project_id == project.id).all()
        mind_map_refs = db.query(StudentProjectMindMapReference).filter(StudentProjectMindMapReference.project_id == project.id).all()
        
        project_data = {
            "id": project.id,
            "user_id": project.user_id,
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat(),
            "contents": contents_data,
            "quiz_references": [ref.quiz_topic_id for ref in quiz_refs],
            "flashcard_references": [ref.flashcard_topic_id for ref in flashcard_refs],
            "essay_references": [ref.essay_topic_id for ref in essay_refs],
            "mind_map_references": [ref.mind_map_id for ref in mind_map_refs],
        }
        projects_data.append(project_data)
    
    logging.warning(f"[STUDENT PROJECT] Found {len(projects_data)} projects for user: {user_id}")
    
    return JSONResponse(
        content={
            "projects": projects_data,
            "total_count": len(projects_data)
        }
    )


@router.get("/student-projects/{project_id}", tags=["Student Projects"])
async def get_student_project(
    project_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get a specific student project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Fetching project {project_id} for user: {user_id}")
    
    # Get the project
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get contents
    contents = db.query(StudentProjectContent).filter(StudentProjectContent.project_id == project.id).all()
    contents_data = [
        {
            "id": content.id,
            "content_type": content.content_type,
            "name": content.name,
            "content_url": content.content_url,
            "content_text": content.content_text,
            "file_size": content.file_size,
            "uploaded_at": content.uploaded_at.isoformat()
        }
        for content in contents
    ]
    
    # Get references
    quiz_refs = db.query(StudentProjectQuizReference).filter(StudentProjectQuizReference.project_id == project.id).all()
    flashcard_refs = db.query(StudentProjectFlashcardReference).filter(StudentProjectFlashcardReference.project_id == project.id).all()
    essay_refs = db.query(StudentProjectEssayReference).filter(StudentProjectEssayReference.project_id == project.id).all()
    mind_map_refs = db.query(StudentProjectMindMapReference).filter(StudentProjectMindMapReference.project_id == project.id).all()
    
    project_data = {
        "id": project.id,
        "user_id": project.user_id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "contents": contents_data,
        "quiz_references": [ref.quiz_topic_id for ref in quiz_refs],
        "flashcard_references": [ref.flashcard_topic_id for ref in flashcard_refs],
        "essay_references": [ref.essay_topic_id for ref in essay_refs],
        "mind_map_references": [ref.mind_map_id for ref in mind_map_refs],
    }
    
    return JSONResponse(content=project_data)


@router.put("/student-projects/{project_id}", tags=["Student Projects"])
async def update_student_project(
    project_id: int,
    request: StudentProjectCreate,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Update a student project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Updating project {project_id} for user: {user_id}")
    
    # Get the project
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update the project
    project.name = request.name
    project.description = request.description
    project.updated_at = datetime.datetime.now()
    
    db.commit()
    db.refresh(project)
    
    return JSONResponse(
        content={
            "message": "Project updated successfully",
            "project_id": project.id,
            "name": project.name,
            "updated_at": project.updated_at.isoformat()
        }
    )


@router.delete("/student-projects/{project_id}", tags=["Student Projects"])
async def delete_student_project(
    project_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Delete a student project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Deleting project {project_id} for user: {user_id}")
    
    # Get the project
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Get all content files to delete from disk
        contents = db.query(StudentProjectContent).filter(StudentProjectContent.project_id == project_id).all()
        
        # Delete PDF files from disk
        for content in contents:
            if content.content_url and os.path.exists(content.content_url):
                try:
                    os.remove(content.content_url)
                    logging.warning(f"[STUDENT PROJECT] Deleted PDF file: {content.content_url}")
                except Exception as file_error:
                    logging.warning(f"[STUDENT PROJECT] Could not delete PDF file {content.content_url}: {file_error}")
        
        # Delete references first (to avoid foreign key violations)
        db.query(StudentProjectQuizReference).filter(StudentProjectQuizReference.project_id == project_id).delete()
        db.query(StudentProjectFlashcardReference).filter(StudentProjectFlashcardReference.project_id == project_id).delete()
        db.query(StudentProjectEssayReference).filter(StudentProjectEssayReference.project_id == project_id).delete()
        db.query(StudentProjectMindMapReference).filter(StudentProjectMindMapReference.project_id == project_id).delete()
        db.query(MindMap).filter(MindMap.project_id == project_id).delete()
        
        # Then delete content
        db.query(StudentProjectContent).filter(StudentProjectContent.project_id == project_id).delete()
        
        # Finally delete the project
        db.delete(project)
        db.commit()
        
        return JSONResponse(
            content={
                "message": "Project deleted successfully",
                "project_id": project_id
            }
        )
    except Exception as e:
        logging.error(f"[STUDENT PROJECT] Error deleting project {project_id}: {e}")
        db.rollback()
        
        # Try alternative deletion method if content_id columns don't exist
        try:
            logging.warning(f"[STUDENT PROJECT] Trying alternative deletion method for project {project_id}")
            
            # Delete references first (to avoid foreign key violations)
            db.query(StudentProjectQuizReference).filter(StudentProjectQuizReference.project_id == project_id).delete()
            db.query(StudentProjectFlashcardReference).filter(StudentProjectFlashcardReference.project_id == project_id).delete()
            db.query(StudentProjectEssayReference).filter(StudentProjectEssayReference.project_id == project_id).delete()
            db.query(StudentProjectMindMapReference).filter(StudentProjectMindMapReference.project_id == project_id).delete()
            db.query(MindMap).filter(MindMap.project_id == project_id).delete()
            
            # Then delete content
            db.query(StudentProjectContent).filter(StudentProjectContent.project_id == project_id).delete()
            
            # Finally delete the project
            db.delete(project)
            db.commit()
            
            return JSONResponse(
                content={
                    "message": "Project deleted successfully",
                    "project_id": project_id
                }
            )
        except Exception as e2:
            logging.error(f"[STUDENT PROJECT] Alternative deletion also failed for project {project_id}: {e2}")
            db.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to delete project: {str(e2)}"
            )


@router.post("/student-projects/{project_id}/content", tags=["Student Projects"])
async def add_project_content(
    project_id: int,
    pdf_files: List[UploadFile] = File(...),
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Add PDF content to a student project (supports multiple files)"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Adding content to project {project_id} for user: {user_id}")
    
    # Verify the project exists and belongs to the user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Handle PDF file uploads
    import shutil
    import uuid
    
    # Get persistent storage directory for PDFs (uses Railway volume if available)
    storage_dir = get_pdf_storage_dir()
    
    uploaded_contents = []
    errors = []
    
    for pdf_file in pdf_files:
        try:
            # Validate file type - check both filename and content type
            filename = pdf_file.filename or ''
            content_type = pdf_file.content_type or ''
            
            logging.warning(f"[STUDENT PROJECT] File upload - filename: {filename}, content_type: {content_type}")
            
            # Check filename extension
            is_pdf_filename = filename.lower().endswith('.pdf')
            # Check MIME type (common PDF MIME types)
            is_pdf_mime = content_type.lower() in ['application/pdf', 'application/x-pdf', 'application/x-bzpdf', 'application/x-gzpdf']
            
            if not is_pdf_filename and not is_pdf_mime:
                logging.error(f"[STUDENT PROJECT] Invalid file type - filename: {filename}, content_type: {content_type}")
                errors.append(f"'{filename}': Only PDF files are accepted")
                continue
            
            # Generate a unique filename to avoid conflicts
            file_extension = os.path.splitext(pdf_file.filename or 'uploaded_file.pdf')[1] or '.pdf'
            unique_filename = f"{project_id}_{uuid.uuid4().hex}{file_extension}"
            file_path = os.path.join(storage_dir, unique_filename)
            
            # Save file to persistent storage
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(pdf_file.file, f)
            file_size = os.path.getsize(file_path)
            
            # Create content entry
            content = StudentProjectContent(
                project_id=project_id,
                content_type='pdf',
                name=pdf_file.filename or 'uploaded_file.pdf',
                content_url=file_path,  # Store persistent path
                file_size=file_size,
                uploaded_at=datetime.datetime.now()
            )
            
            db.add(content)
            db.flush()  # Flush to get the ID without committing
            db.refresh(content)
            
            uploaded_contents.append({
                "id": content.id,
                "content_type": content.content_type,
                "name": content.name,
                "content_url": content.content_url,
                "file_size": content.file_size,
                "uploaded_at": content.uploaded_at.isoformat()
            })
        except Exception as e:
            logging.error(f"[STUDENT PROJECT] Error uploading file {pdf_file.filename}: {e}")
            errors.append(f"'{pdf_file.filename}': {str(e)}")
            continue
    
    # Commit all successful uploads at once
    if uploaded_contents:
        db.commit()
    
    # Return response
    if errors and not uploaded_contents:
        # All uploads failed
        raise HTTPException(
            status_code=400,
            detail=f"All uploads failed: {'; '.join(errors)}"
        )
    elif errors:
        # Some uploads succeeded, some failed
        return JSONResponse(
            content={
                "message": f"Successfully uploaded {len(uploaded_contents)} file(s). {len(errors)} file(s) failed.",
                "content": uploaded_contents,
                "errors": errors,
                "partial_success": True
            },
            status_code=207  # Multi-Status
        )
    else:
        # All uploads succeeded
        return JSONResponse(
            content={
                "message": f"Successfully uploaded {len(uploaded_contents)} file(s)",
                "content": uploaded_contents,
            },
            status_code=201
        )


@router.get("/student-projects/{project_id}/content/{content_id}/view", tags=["Student Projects"])
async def view_project_content(
    project_id: int,
    content_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> FileResponse:
    """Serve PDF file for viewing"""
    user_id = current_user.id
    
    # Verify the project exists and belongs to the user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get the content
    content = db.query(StudentProjectContent).filter(
        StudentProjectContent.id == content_id,
        StudentProjectContent.project_id == project_id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.content_type != 'pdf':
        raise HTTPException(status_code=400, detail="Content is not a PDF file")
    
    if not content.content_url or not os.path.exists(content.content_url):
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    
    return FileResponse(
        path=content.content_url,
        media_type='application/pdf',
        filename=content.name or 'document.pdf',
        headers={
            'Content-Disposition': f'inline; filename="{content.name or "document.pdf"}"'
        }
    )


def _process_quiz_generation_job(job_id: int) -> None:
    session = SessionLocal()
    try:
        job = session.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        if not job:
            logging.error("[GEN JOB] Job %s not found", job_id)
            return

        job.status = "in_progress"
        job.updated_at = datetime.datetime.now()
        session.commit()

        user = session.query(User).filter(User.id == job.user_id).first()
        if not user:
            job.status = "failed"
            job.error_message = "User not found"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        content = session.query(StudentProjectContent).filter(
            StudentProjectContent.id == job.content_id,
            StudentProjectContent.project_id == job.project_id,
        ).first()

        if not content:
            job.status = "failed"
            job.error_message = "Content not found"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        if content.content_type != "pdf" or not content.content_url:
            job.status = "failed"
            job.error_message = "Only PDF content is supported for quiz generation"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        payload = job.payload or {}
        requested_questions = payload.get("num_questions")
        difficulty = payload.get("difficulty") or "medium"

        existing_refs = (
            session.query(StudentProjectQuizReference)
            .filter(
                StudentProjectQuizReference.project_id == job.project_id,
                StudentProjectQuizReference.content_id == job.content_id,
            )
            .all()
        )
        scoped_topic_ids = [ref.quiz_topic_id for ref in existing_refs if ref.quiz_topic_id]
        feedback_context = collect_feedback_context(
            session,
            user_id=user.id,
            quiz_topic_ids=scoped_topic_ids or None,
        )
        if not feedback_context:
            feedback_context = collect_feedback_context(session, user_id=user.id)

        quiz_data = generate_quiz_from_pdf(
            content.content_url,
            requested_questions if requested_questions and requested_questions > 0 else None,
            difficulty,
            feedback=feedback_context,
        )

        quiz_topic = QuizTopic(
            topic=quiz_data["topic"],
            category=quiz_data["category"],
            subcategory=quiz_data["subcategory"],
            difficulty=difficulty,
            creation_timestamp=datetime.datetime.now(),
            created_by_user_id=user.id,
        )
        session.add(quiz_topic)
        session.flush()

        for question in quiz_data["questions"]:
            quiz_question = QuizQuestion(
                question=question["question"],
                options=question["options"],
                right_option=question["right_option"],
                topic_id=quiz_topic.id,
            )
            session.add(quiz_question)

        quiz_reference = StudentProjectQuizReference(
            project_id=job.project_id,
            content_id=job.content_id,
            quiz_topic_id=quiz_topic.id,
            created_at=datetime.datetime.now(),
        )
        session.add(quiz_reference)

        consume_generation_token(session, user)

        job.status = "completed"
        job.result_topic_id = quiz_topic.id
        job.completed_at = datetime.datetime.now()
        job.updated_at = datetime.datetime.now()
        session.commit()

        logging.info(
            "[GEN JOB] Quiz generation completed for job %s -> quiz %s",
            job_id,
            quiz_topic.id,
        )
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception("[GEN JOB] Quiz generation failed for job %s: %s", job_id, exc)
        try:
            job = session.query(GenerationJob).filter(GenerationJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = str(exc)
                job.completed_at = datetime.datetime.now()
                job.updated_at = datetime.datetime.now()
                session.commit()
        except Exception:  # pylint: disable=broad-except
            session.rollback()
    finally:
        session.close()


def _process_essay_generation_job(job_id: int) -> None:
    session = SessionLocal()
    try:
        job = session.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        if not job:
            logging.error("[GEN JOB] Job %s not found", job_id)
            return

        job.status = "in_progress"
        job.updated_at = datetime.datetime.now()
        session.commit()

        user = session.query(User).filter(User.id == job.user_id).first()
        if not user:
            job.status = "failed"
            job.error_message = "User not found"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        content = session.query(StudentProjectContent).filter(
            StudentProjectContent.id == job.content_id,
            StudentProjectContent.project_id == job.project_id,
        ).first()

        if not content:
            job.status = "failed"
            job.error_message = "Content not found"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        if content.content_type != "pdf" or not content.content_url:
            job.status = "failed"
            job.error_message = "Only PDF content is supported for essay generation"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        payload = job.payload or {}
        requested_questions = payload.get("num_questions") or 3
        difficulty = payload.get("difficulty") or "medium"

        existing_refs = (
            session.query(StudentProjectEssayReference)
            .filter(
                StudentProjectEssayReference.project_id == job.project_id,
                StudentProjectEssayReference.content_id == job.content_id,
            )
            .all()
        )
        scoped_essay_topic_ids = [ref.essay_topic_id for ref in existing_refs if ref.essay_topic_id]
        feedback_context = collect_feedback_context(
            session,
            user_id=user.id,
            essay_topic_ids=scoped_essay_topic_ids or None,
        )
        if not feedback_context:
            feedback_context = collect_feedback_context(session, user_id=user.id)

        essay_data, token_usage = generate_essay_qa_from_pdf(
            content.content_url,
            requested_questions,
            difficulty,
            feedback=feedback_context,
        )

        # Create essay topic
        try:
            essay_topic = EssayQATopic(
                topic=essay_data["topic"],
                category=essay_data["category"],
                subcategory=essay_data["subcategory"],
                difficulty=difficulty,
                creation_timestamp=datetime.datetime.now(),
                created_by_user_id=user.id,
            )
        except Exception:
            # Fallback: create without difficulty if column doesn't exist
            essay_topic = EssayQATopic(
                topic=essay_data["topic"],
                category=essay_data["category"],
                subcategory=essay_data["subcategory"],
                creation_timestamp=datetime.datetime.now(),
                created_by_user_id=user.id,
            )
        session.add(essay_topic)
        session.flush()

        # Add questions
        for q in essay_data["questions"]:
            essay_question = EssayQAQuestion(
                question=q["question"],
                full_answer=q["full_answer"],
                key_info=q["key_info"],
                topic_id=essay_topic.id,
            )
            session.add(essay_question)

        # Create reference
        essay_reference = StudentProjectEssayReference(
            project_id=job.project_id,
            content_id=job.content_id,
            essay_topic_id=essay_topic.id,
            created_at=datetime.datetime.now(),
        )
        session.add(essay_reference)

        consume_generation_token(session, user)

        # Store token usage in the job
        job.input_tokens = token_usage.get("input_tokens", 0)
        job.output_tokens = token_usage.get("output_tokens", 0)
        job.total_tokens = token_usage.get("total_tokens", 0)
        logging.info("[GEN JOB] Essay token usage: input=%d, output=%d, total=%d", 
                    job.input_tokens, job.output_tokens, job.total_tokens)

        job.status = "completed"
        job.result_topic_id = essay_topic.id
        job.completed_at = datetime.datetime.now()
        job.updated_at = datetime.datetime.now()
        session.commit()

        logging.info(
            "[GEN JOB] Essay generation completed for job %s -> essay %s",
            job_id,
            essay_topic.id,
        )
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception("[GEN JOB] Essay generation failed for job %s: %s", job_id, exc)
        try:
            job = session.query(GenerationJob).filter(GenerationJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = str(exc)
                job.completed_at = datetime.datetime.now()
                job.updated_at = datetime.datetime.now()
                session.commit()
        except Exception:  # pylint: disable=broad-except
            session.rollback()
    finally:
        session.close()


def _process_mind_map_generation_job(job_id: int) -> None:
    session = SessionLocal()
    try:
        logging.info("[MIND MAP JOB] Starting mind map generation job %s", job_id)
        job = session.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        if not job:
            logging.error("[MIND MAP JOB] Job %s not found", job_id)
            return

        logging.debug("[MIND MAP JOB] Job %s found: user_id=%s, project_id=%s, content_id=%s", 
                     job_id, job.user_id, job.project_id, job.content_id)

        job.status = "in_progress"
        job.updated_at = datetime.datetime.now()
        session.commit()
        logging.debug("[MIND MAP JOB] Job %s status set to 'in_progress'", job_id)

        user = session.query(User).filter(User.id == job.user_id).first()
        if not user:
            logging.error("[MIND MAP JOB] User %s not found for job %s", job.user_id, job_id)
            job.status = "failed"
            job.error_message = "User not found"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        logging.debug("[MIND MAP JOB] User %s validated for job %s", user.id, job_id)

        content = session.query(StudentProjectContent).filter(
            StudentProjectContent.id == job.content_id,
            StudentProjectContent.project_id == job.project_id,
        ).first()

        if not content:
            logging.error("[MIND MAP JOB] Content %s not found for job %s", job.content_id, job_id)
            job.status = "failed"
            job.error_message = "Content not found"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        if content.content_type != "pdf" or not content.content_url:
            logging.error("[MIND MAP JOB] Invalid content type for job %s: type=%s, url=%s", 
                         job_id, content.content_type, bool(content.content_url))
            job.status = "failed"
            job.error_message = "Only PDF content is supported for mind map generation"
            job.completed_at = datetime.datetime.now()
            job.updated_at = datetime.datetime.now()
            session.commit()
            return

        logging.info("[MIND MAP JOB] Processing PDF content: %s (content_id=%s)", 
                    content.content_url, content.id)

        payload = job.payload or {}
        focus = payload.get("focus")
        include_examples = payload.get("include_examples", True)
        logging.debug("[MIND MAP JOB] Job %s payload: focus=%s, include_examples=%s", 
                     job_id, bool(focus), include_examples)

        feedback_context = collect_feedback_context(session, user_id=user.id)
        if feedback_context:
            logging.debug("[MIND MAP JOB] Collected feedback context (length: %d chars)", len(feedback_context))

        logging.info("[MIND MAP JOB] Calling generate_mind_map_from_pdf for job %s", job_id)
        mind_map_data, token_usage = generate_mind_map_from_pdf(
            content.content_url,
            focus=focus,
            feedback=feedback_context,
        )

        nodes_payload = mind_map_data.get("nodes") or []
        original_node_count = len(nodes_payload)
        if not include_examples:
            for node in nodes_payload:
                node.pop("examples", None)
            logging.debug("[MIND MAP JOB] Removed examples from %d nodes", original_node_count)

        logging.info("[MIND MAP JOB] Creating MindMap record for job %s", job_id)
        mind_map = MindMap(
            user_id=user.id,
            project_id=job.project_id,
            content_id=job.content_id,
            title=mind_map_data.get("topic") or content.name,
            category=mind_map_data.get("category"),
            subcategory=mind_map_data.get("subcategory"),
            central_idea=mind_map_data.get("central_idea") or (mind_map_data.get("topic") or content.name),
            summary=mind_map_data.get("summary"),
            key_concepts=mind_map_data.get("key_concepts") or [],
            nodes=nodes_payload,
            edges=mind_map_data.get("edges") or [],
            connections=mind_map_data.get("connections") or [],
            callouts=mind_map_data.get("callouts") or [],
            recommended_next_steps=mind_map_data.get("recommended_next_steps") or [],
            extra_metadata={
                "focus": focus,
                "include_examples": include_examples,
                "source_content_id": job.content_id,
            },
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now(),
        )
        session.add(mind_map)
        session.flush()
        logging.info("[MIND MAP JOB] MindMap record created with id=%s (title='%s')", 
                    mind_map.id, mind_map.title)

        mind_map_reference = StudentProjectMindMapReference(
            project_id=job.project_id,
            content_id=job.content_id,
            mind_map_id=mind_map.id,
            created_at=datetime.datetime.now(),
        )
        session.add(mind_map_reference)
        logging.debug("[MIND MAP JOB] Created mind map reference for project %s, content %s", 
                     job.project_id, job.content_id)

        consume_generation_token(session, user)
        logging.debug("[MIND MAP JOB] Consumed generation token for user %s", user.id)

        # Store token usage in the job
        job.input_tokens = token_usage.get("input_tokens", 0)
        job.output_tokens = token_usage.get("output_tokens", 0)
        job.total_tokens = token_usage.get("total_tokens", 0)
        logging.info("[MIND MAP JOB] Token usage: input=%d, output=%d, total=%d", 
                    job.input_tokens, job.output_tokens, job.total_tokens)

        job.status = "completed"
        job.result_topic_id = mind_map.id
        job.completed_at = datetime.datetime.now()
        job.updated_at = datetime.datetime.now()
        session.commit()

        logging.info("[MIND MAP JOB] Mind map generation completed successfully: job_id=%s, mind_map_id=%s, nodes=%d, edges=%d", 
                    job_id, mind_map.id, len(nodes_payload), len(mind_map_data.get("edges", [])))
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception("[MIND MAP JOB] Mind map generation failed for job %s: %s", job_id, exc)
        try:
            job = session.query(GenerationJob).filter(GenerationJob.id == job_id).first()
            if job:
                logging.error("[MIND MAP JOB] Marking job %s as failed with error: %s", job_id, str(exc))
                job.status = "failed"
                job.error_message = str(exc)
                job.completed_at = datetime.datetime.now()
                job.updated_at = datetime.datetime.now()
                session.commit()
        except Exception as inner_exc:  # pylint: disable=broad-except
            logging.error("[MIND MAP JOB] Failed to update job %s status after error: %s", job_id, str(inner_exc))
            session.rollback()
    finally:
        session.close()


@router.post(
    "/student-projects/{project_id}/content/{content_id}/quiz-generation",
    tags=["Student Projects"],
    status_code=202,
)
async def start_quiz_generation_job(
    project_id: int,
    content_id: int,
    request: QuizGenerationJobRequest,
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Start an asynchronous quiz generation job for a project content."""
    if request.difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty level. Choose from: easy, medium, hard",
        )

    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == current_user.id,
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    content = db.query(StudentProjectContent).filter(
        StudentProjectContent.id == content_id,
        StudentProjectContent.project_id == project_id,
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    if content.content_type != "pdf" or not content.content_url:
        raise HTTPException(
            status_code=400,
            detail="Only PDF content can be used for quiz generation",
        )

    payload = {
        "num_questions": request.num_questions if request.num_questions and request.num_questions > 0 else None,
        "difficulty": request.difficulty,
    }

    job = GenerationJob(
        user_id=current_user.id,
        project_id=project_id,
        content_id=content_id,
        job_type="quiz",
        status="pending",
        payload=payload,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(_process_quiz_generation_job, job.id)

    return JSONResponse(
        content={
            "job_id": job.id,
            "status": job.status,
            "job_type": job.job_type,
            "requested_questions": payload.get("num_questions"),
            "difficulty": payload.get("difficulty"),
            "message": "Quiz generation started. You will be notified when it is ready.",
        },
        status_code=202,
    )


@router.get(
    "/generation-jobs/{job_id}",
    tags=["Student Projects"],
    response_model=GenerationJobStatusResponse,
)
async def get_generation_job_status(
    job_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db),
) -> GenerationJobStatusResponse:
    """Retrieve the status of a generation job."""
    job = db.query(GenerationJob).filter(
        GenerationJob.id == job_id,
        GenerationJob.user_id == current_user.id,
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    payload = job.payload or {}
    result: Optional[dict] = None

    if job.status == "completed" and job.result_topic_id:
        if job.job_type == "quiz":
            quiz = db.query(QuizTopic).filter(QuizTopic.id == job.result_topic_id).first()
            if quiz:
                result = {"quiz_id": quiz.id, "topic": quiz.topic}
        elif job.job_type == "essay":
            essay = db.query(EssayQATopic).filter(EssayQATopic.id == job.result_topic_id).first()
            if essay:
                result = {"essay_id": essay.id, "topic": essay.topic}
        elif job.job_type == "mind_map":
            mind_map = db.query(MindMap).filter(MindMap.id == job.result_topic_id).first()
            if mind_map:
                result = {"mind_map_id": mind_map.id, "topic": mind_map.title}

    return GenerationJobStatusResponse(
        job_id=job.id,
        status=job.status,
        job_type=job.job_type,
        requested_questions=payload.get("num_questions"),
        difficulty=payload.get("difficulty"),
        result=result,
        error_message=job.error_message,
        created_at=job.created_at.isoformat() if job.created_at else None,
        updated_at=job.updated_at.isoformat() if job.updated_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
    )


@router.post(
    "/student-projects/{project_id}/content/{content_id}/essay-generation",
    tags=["Student Projects"],
    status_code=202,
)
async def start_essay_generation_job(
    project_id: int,
    content_id: int,
    request: EssayGenerationJobRequest,
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Start an asynchronous essay generation job for a project content."""
    if request.difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty level. Choose from: easy, medium, hard",
        )

    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == current_user.id,
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    content = db.query(StudentProjectContent).filter(
        StudentProjectContent.id == content_id,
        StudentProjectContent.project_id == project_id,
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    if content.content_type != "pdf" or not content.content_url:
        raise HTTPException(
            status_code=400,
            detail="Only PDF content can be used for essay generation",
        )

    payload = {
        "num_questions": request.num_questions if request.num_questions and request.num_questions > 0 else None,
        "difficulty": request.difficulty,
    }

    job = GenerationJob(
        user_id=current_user.id,
        project_id=project_id,
        content_id=content_id,
        job_type="essay",
        status="pending",
        payload=payload,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(_process_essay_generation_job, job.id)

    return JSONResponse(
        content={
            "job_id": job.id,
            "status": job.status,
            "job_type": job.job_type,
            "requested_questions": payload.get("num_questions"),
            "difficulty": payload.get("difficulty"),
            "message": "Essay generation started. You will be notified when it is ready.",
        },
        status_code=202,
    )


@router.post(
    "/student-projects/{project_id}/content/{content_id}/mind-map-generation",
    tags=["Student Projects"],
    status_code=202,
)
async def start_mind_map_generation_job(
    project_id: int,
    content_id: int,
    request: MindMapGenerationJobRequest,
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Start an asynchronous mind map generation job for a project content."""
    logging.info("[MIND MAP API] Starting mind map generation request: user_id=%s, project_id=%s, content_id=%s", 
                current_user.id, project_id, content_id)
    
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == current_user.id,
    ).first()

    if not project:
        logging.warning("[MIND MAP API] Project %s not found for user %s", project_id, current_user.id)
        raise HTTPException(status_code=404, detail="Project not found")

    content = db.query(StudentProjectContent).filter(
        StudentProjectContent.id == content_id,
        StudentProjectContent.project_id == project_id,
    ).first()

    if not content:
        logging.warning("[MIND MAP API] Content %s not found for project %s", content_id, project_id)
        raise HTTPException(status_code=404, detail="Content not found")

    if content.content_type != "pdf" or not content.content_url:
        logging.warning("[MIND MAP API] Invalid content type for mind map generation: type=%s, url=%s", 
                       content.content_type, bool(content.content_url))
        raise HTTPException(
            status_code=400,
            detail="Only PDF content can be used for mind map generation",
        )

    payload = {
        "focus": request.focus,
        "include_examples": request.include_examples,
    }
    logging.debug("[MIND MAP API] Request payload: focus=%s, include_examples=%s", 
                 bool(request.focus), request.include_examples)

    job = GenerationJob(
        user_id=current_user.id,
        project_id=project_id,
        content_id=content_id,
        job_type="mind_map",
        status="pending",
        payload=payload,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    logging.info("[MIND MAP API] Created generation job %s for user %s, project %s, content %s", 
                job.id, current_user.id, project_id, content_id)

    background_tasks.add_task(_process_mind_map_generation_job, job.id)
    logging.debug("[MIND MAP API] Enqueued background task for job %s", job.id)

    return JSONResponse(
        content={
            "job_id": job.id,
            "status": job.status,
            "job_type": job.job_type,
            "message": "Mind map generation started. We'll notify you when it's ready.",
        },
        status_code=202,
    )


@router.delete("/student-projects/{project_id}/content/{content_id}", tags=["Student Projects"])
async def delete_project_content(
    project_id: int,
    content_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Delete content from a student project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Deleting content {content_id} from project {project_id} for user: {user_id}")
    
    # Verify the project exists and belongs to the user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get the content
    content = db.query(StudentProjectContent).filter(
        StudentProjectContent.id == content_id,
        StudentProjectContent.project_id == project_id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    try:
        # Delete the PDF file from disk if it exists
        if content.content_url and os.path.exists(content.content_url):
            try:
                os.remove(content.content_url)
                logging.warning(f"[STUDENT PROJECT] Deleted PDF file: {content.content_url}")
            except Exception as file_error:
                logging.warning(f"[STUDENT PROJECT] Could not delete PDF file {content.content_url}: {file_error}")
        
        # Delete references to this content first (to avoid foreign key violations)
        db.query(StudentProjectQuizReference).filter(StudentProjectQuizReference.content_id == content_id).delete()
        db.query(StudentProjectFlashcardReference).filter(StudentProjectFlashcardReference.content_id == content_id).delete()
        db.query(StudentProjectEssayReference).filter(StudentProjectEssayReference.content_id == content_id).delete()
        db.query(StudentProjectMindMapReference).filter(StudentProjectMindMapReference.content_id == content_id).delete()
        db.query(MindMap).filter(MindMap.content_id == content_id).delete()
        
        # Then delete the content
        db.delete(content)
        db.commit()
        
        return JSONResponse(
            content={
                "message": "Content deleted successfully",
                "content_id": content_id
            }
        )
    except Exception as e:
        logging.error(f"[STUDENT PROJECT] Error deleting content {content_id}: {e}")
        db.rollback()
        
        # Try alternative deletion method if content_id columns don't exist
        try:
            logging.warning(f"[STUDENT PROJECT] Trying alternative deletion method for content {content_id}")
            
            # Delete the content directly (references will be handled by cascade or manual cleanup)
            db.query(StudentProjectMindMapReference).filter(StudentProjectMindMapReference.content_id == content_id).delete()
            db.query(MindMap).filter(MindMap.content_id == content_id).delete()
            db.delete(content)
            db.commit()
            
            return JSONResponse(
                content={
                    "message": "Content deleted successfully",
                    "content_id": content_id
                }
            )
        except Exception as e2:
            logging.error(f"[STUDENT PROJECT] Alternative deletion also failed for content {content_id}: {e2}")
            db.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to delete content: {str(e2)}"
            )


@router.post("/student-projects/{project_id}/references", tags=["Student Projects"])
async def add_project_reference(
    project_id: int,
    request: StudentProjectReferenceCreate,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Add a reference to a quiz/flashcard/essay topic"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Adding {request.reference_type} reference to project {project_id} for user: {user_id}")
    
    # Verify the project exists and belongs to the user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify the topic exists based on reference type
    if request.reference_type == "quiz":
        topic = db.query(QuizTopic).filter(QuizTopic.id == request.topic_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Quiz topic not found")
        
        # Check if reference already exists
        existing_ref = db.query(StudentProjectQuizReference).filter(
            StudentProjectQuizReference.project_id == project_id,
            StudentProjectQuizReference.quiz_topic_id == request.topic_id
        ).first()
        
        if existing_ref:
            raise HTTPException(status_code=400, detail="Reference already exists")
        
        # Create the reference
        reference = StudentProjectQuizReference(
            project_id=project_id,
            quiz_topic_id=request.topic_id,
            created_at=datetime.datetime.now()
        )
        
    elif request.reference_type == "flashcard":
        topic = db.query(FlashcardTopic).filter(FlashcardTopic.id == request.topic_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Flashcard topic not found")
        
        # Check if reference already exists
        existing_ref = db.query(StudentProjectFlashcardReference).filter(
            StudentProjectFlashcardReference.project_id == project_id,
            StudentProjectFlashcardReference.flashcard_topic_id == request.topic_id
        ).first()
        
        if existing_ref:
            raise HTTPException(status_code=400, detail="Reference already exists")
        
        # Create the reference
        reference = StudentProjectFlashcardReference(
            project_id=project_id,
            flashcard_topic_id=request.topic_id,
            created_at=datetime.datetime.now()
        )
        
    elif request.reference_type == "essay":
        topic = db.query(EssayQATopic).filter(EssayQATopic.id == request.topic_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Essay topic not found")
        
        # Check if reference already exists
        existing_ref = db.query(StudentProjectEssayReference).filter(
            StudentProjectEssayReference.project_id == project_id,
            StudentProjectEssayReference.essay_topic_id == request.topic_id
        ).first()
        
        if existing_ref:
            raise HTTPException(status_code=400, detail="Reference already exists")
        
        # Create the reference
        reference = StudentProjectEssayReference(
            project_id=project_id,
            essay_topic_id=request.topic_id,
            created_at=datetime.datetime.now()
        )
        
    else:
        raise HTTPException(status_code=400, detail="Invalid reference type")
    
    db.add(reference)
    db.commit()
    db.refresh(reference)
    
    return JSONResponse(
        content={
            "message": f"{request.reference_type.capitalize()} reference added successfully",
            "reference_id": reference.id,
            "topic_id": request.topic_id,
            "created_at": reference.created_at.isoformat()
        },
        status_code=201
    )


@router.delete("/student-projects/{project_id}/references/{reference_type}/{topic_id}", tags=["Student Projects"])
async def delete_project_reference(
    project_id: int,
    reference_type: str,
    topic_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Delete a reference from a student project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Deleting {reference_type} reference {topic_id} from project {project_id} for user: {user_id}")
    
    # Verify the project exists and belongs to the user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete the reference based on type
    if reference_type == "quiz":
        reference = db.query(StudentProjectQuizReference).filter(
            StudentProjectQuizReference.project_id == project_id,
            StudentProjectQuizReference.quiz_topic_id == topic_id
        ).first()
        
    elif reference_type == "flashcard":
        reference = db.query(StudentProjectFlashcardReference).filter(
            StudentProjectFlashcardReference.project_id == project_id,
            StudentProjectFlashcardReference.flashcard_topic_id == topic_id
        ).first()
        
    elif reference_type == "essay":
        reference = db.query(StudentProjectEssayReference).filter(
            StudentProjectEssayReference.project_id == project_id,
            StudentProjectEssayReference.essay_topic_id == topic_id
        ).first()
        
    else:
        raise HTTPException(status_code=400, detail="Invalid reference type")
    
    if not reference:
        raise HTTPException(status_code=404, detail="Reference not found")
    
    # Delete the reference
    db.delete(reference)
    db.commit()
    
    return JSONResponse(
        content={
            "message": f"{reference_type.capitalize()} reference deleted successfully",
            "topic_id": topic_id
        }
    ) 


@router.get("/student-projects/{project_id}/generated-content", tags=["Student Projects"])
async def get_project_generated_content(
    project_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get all generated content (quizzes, flashcards, essays) for a specific project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Fetching generated content for project: {project_id}")
    
    # Verify project exists and belongs to user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get quiz references
    quiz_references = db.query(StudentProjectQuizReference).filter(
        StudentProjectQuizReference.project_id == project_id
    ).all()
    
    quizzes = []
    for ref in quiz_references:
        quiz_topic = db.query(QuizTopic).filter(QuizTopic.id == ref.quiz_topic_id).first()
        if quiz_topic:
            # Get the number of questions for this quiz
            question_count = db.query(QuizQuestion).filter(QuizQuestion.topic_id == quiz_topic.id).count()
            
            quizzes.append({
                "id": quiz_topic.id,
                "topic": quiz_topic.topic,
                "category": quiz_topic.category,
                "subcategory": quiz_topic.subcategory,
                "difficulty": quiz_topic.difficulty,
                "question_count": question_count,
                "creation_timestamp": quiz_topic.creation_timestamp.isoformat() if quiz_topic.creation_timestamp else None,
                "reference_created_at": ref.created_at.isoformat() if ref.created_at else None
            })
    
    # Get flashcard references
    flashcard_references = db.query(StudentProjectFlashcardReference).filter(
        StudentProjectFlashcardReference.project_id == project_id
    ).all()
    
    flashcards = []
    for ref in flashcard_references:
        flashcard_topic = db.query(FlashcardTopic).filter(FlashcardTopic.id == ref.flashcard_topic_id).first()
        if flashcard_topic:
            # Get the number of cards for this flashcard set
            from backend.database.sqlite_dal import FlashcardCard
            card_count = db.query(FlashcardCard).filter(FlashcardCard.topic_id == flashcard_topic.id).count()
            
            flashcards.append({
                "id": flashcard_topic.id,
                "topic": flashcard_topic.topic,
                "category": flashcard_topic.category,
                "subcategory": flashcard_topic.subcategory,
                "difficulty": flashcard_topic.difficulty,
                "card_count": card_count,
                "creation_timestamp": flashcard_topic.creation_timestamp.isoformat() if flashcard_topic.creation_timestamp else None,
                "reference_created_at": ref.created_at.isoformat() if ref.created_at else None
            })
    
    # Get essay references
    essay_references = db.query(StudentProjectEssayReference).filter(
        StudentProjectEssayReference.project_id == project_id
    ).all()
    
    essays = []
    for ref in essay_references:
        essay_topic = db.query(EssayQATopic).filter(EssayQATopic.id == ref.essay_topic_id).first()
        if essay_topic:
            # Get the number of questions for this essay set
            from backend.database.sqlite_dal import EssayQAQuestion
            question_count = db.query(EssayQAQuestion).filter(EssayQAQuestion.topic_id == essay_topic.id).count()
            
            essays.append({
                "id": essay_topic.id,
                "topic": essay_topic.topic,
                "category": essay_topic.category,
                "subcategory": essay_topic.subcategory,
                "difficulty": essay_topic.difficulty,
                "question_count": question_count,
                "creation_timestamp": essay_topic.creation_timestamp.isoformat() if essay_topic.creation_timestamp else None,
                "reference_created_at": ref.created_at.isoformat() if ref.created_at else None
            })
    
    # Get mind map references
    mind_map_references = db.query(StudentProjectMindMapReference).filter(
        StudentProjectMindMapReference.project_id == project_id
    ).all()

    mind_maps = []
    for ref in mind_map_references:
        mind_map = db.query(MindMap).filter(MindMap.id == ref.mind_map_id).first()
        if mind_map:
            mind_maps.append({
                "id": mind_map.id,
                "title": mind_map.title,
                "central_idea": mind_map.central_idea,
                "category": mind_map.category,
                "subcategory": mind_map.subcategory,
                "node_count": len(mind_map.nodes or []),
                "created_at": mind_map.created_at.isoformat() if mind_map.created_at else None,
                "reference_created_at": ref.created_at.isoformat() if ref.created_at else None
            })

    return JSONResponse(
        content={
            "project_id": project_id,
            "project_name": project.name,
            "quizzes": quizzes,
            "flashcards": flashcards,
            "essays": essays,
            "mind_maps": mind_maps,
            "total_quizzes": len(quizzes),
            "total_flashcards": len(flashcards),
            "total_essays": len(essays),
            "total_mind_maps": len(mind_maps)
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/student-projects/{project_id}/content/{content_id}/generated-content", tags=["Student Projects"])
async def get_content_generated_content(
    project_id: int,
    content_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Get generated content for a specific content item (PDF) in a project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Fetching generated content for content: {content_id} in project: {project_id}")
    
    # Verify project exists and belongs to user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify content exists in project
    content = db.query(StudentProjectContent).filter(
        StudentProjectContent.id == content_id,
        StudentProjectContent.project_id == project_id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Get quiz references for this specific content
    quiz_references = db.query(StudentProjectQuizReference).filter(
        StudentProjectQuizReference.project_id == project_id,
        StudentProjectQuizReference.content_id == content_id
    ).all()
    
    quizzes = []
    for ref in quiz_references:
        quiz_topic = db.query(QuizTopic).filter(QuizTopic.id == ref.quiz_topic_id).first()
        if quiz_topic:
            # Get the number of questions for this quiz
            question_count = db.query(QuizQuestion).filter(QuizQuestion.topic_id == quiz_topic.id).count()
            
            quizzes.append({
                "id": quiz_topic.id,
                "topic": quiz_topic.topic,
                "category": quiz_topic.category,
                "subcategory": quiz_topic.subcategory,
                "difficulty": quiz_topic.difficulty,
                "question_count": question_count,
                "creation_timestamp": quiz_topic.creation_timestamp.isoformat() if quiz_topic.creation_timestamp else None,
                "reference_created_at": ref.created_at.isoformat() if ref.created_at else None
            })
    
    # Get flashcard references for this specific content
    flashcard_references = db.query(StudentProjectFlashcardReference).filter(
        StudentProjectFlashcardReference.project_id == project_id,
        StudentProjectFlashcardReference.content_id == content_id
    ).all()
    
    flashcards = []
    for ref in flashcard_references:
        flashcard_topic = db.query(FlashcardTopic).filter(FlashcardTopic.id == ref.flashcard_topic_id).first()
        if flashcard_topic:
            # Get the number of cards for this flashcard set
            from backend.database.sqlite_dal import FlashcardCard
            card_count = db.query(FlashcardCard).filter(FlashcardCard.topic_id == flashcard_topic.id).count()
            
            flashcards.append({
                "id": flashcard_topic.id,
                "topic": flashcard_topic.topic,
                "category": flashcard_topic.category,
                "subcategory": flashcard_topic.subcategory,
                "difficulty": flashcard_topic.difficulty,
                "card_count": card_count,
                "creation_timestamp": flashcard_topic.creation_timestamp.isoformat() if flashcard_topic.creation_timestamp else None,
                "reference_created_at": ref.created_at.isoformat() if ref.created_at else None
            })
    
    # Get essay references for this specific content
    essay_references = db.query(StudentProjectEssayReference).filter(
        StudentProjectEssayReference.project_id == project_id,
        StudentProjectEssayReference.content_id == content_id
    ).all()
    
    essays = []
    for ref in essay_references:
        essay_topic = db.query(EssayQATopic).filter(EssayQATopic.id == ref.essay_topic_id).first()
        if essay_topic:
            # Get the number of questions for this essay set
            from backend.database.sqlite_dal import EssayQAQuestion
            question_count = db.query(EssayQAQuestion).filter(EssayQAQuestion.topic_id == essay_topic.id).count()
            
            essays.append({
                "id": essay_topic.id,
                "topic": essay_topic.topic,
                "category": essay_topic.category,
                "subcategory": essay_topic.subcategory,
                "difficulty": essay_topic.difficulty,
                "question_count": question_count,
                "creation_timestamp": essay_topic.creation_timestamp.isoformat() if essay_topic.creation_timestamp else None,
                "reference_created_at": ref.created_at.isoformat() if ref.created_at else None
            })

    # Mind maps for this content
    mind_map_references = db.query(StudentProjectMindMapReference).filter(
        StudentProjectMindMapReference.project_id == project_id,
        StudentProjectMindMapReference.content_id == content_id
    ).all()

    mind_maps = []
    for ref in mind_map_references:
        mind_map = db.query(MindMap).filter(MindMap.id == ref.mind_map_id).first()
        if mind_map:
            mind_maps.append({
                "id": mind_map.id,
                "title": mind_map.title,
                "central_idea": mind_map.central_idea,
                "category": mind_map.category,
                "subcategory": mind_map.subcategory,
                "node_count": len(mind_map.nodes or []),
                "created_at": mind_map.created_at.isoformat() if mind_map.created_at else None,
                "reference_created_at": ref.created_at.isoformat() if ref.created_at else None
            })
    
    return JSONResponse(
        content={
            "project_id": project_id,
            "content_id": content_id,
            "content_name": content.name,
            "content_type": content.content_type,
            "quizzes": quizzes,
            "flashcards": flashcards,
            "essays": essays,
            "mind_maps": mind_maps,
            "total_quizzes": len(quizzes),
            "total_flashcards": len(flashcards),
            "total_essays": len(essays),
            "total_mind_maps": len(mind_maps)
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


@router.get("/mind-maps/{mind_map_id}", tags=["Student Projects"])
async def get_mind_map(
    mind_map_id: int,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Fetch a generated mind map."""
    mind_map = (
        db.query(MindMap)
        .join(StudentProject, MindMap.project_id == StudentProject.id)
        .filter(
            MindMap.id == mind_map_id,
            StudentProject.user_id == current_user.id,
        )
        .first()
    )

    if not mind_map:
        raise HTTPException(status_code=404, detail="Mind map not found")

    return JSONResponse(
        content={
            "id": mind_map.id,
            "project_id": mind_map.project_id,
            "content_id": mind_map.content_id,
            "title": mind_map.title,
            "category": mind_map.category,
            "subcategory": mind_map.subcategory,
            "central_idea": mind_map.central_idea,
            "summary": mind_map.summary,
            "key_concepts": mind_map.key_concepts or [],
            "nodes": mind_map.nodes or [],
            "edges": mind_map.edges or [],
            "connections": mind_map.connections or [],
            "callouts": mind_map.callouts or [],
            "recommended_next_steps": mind_map.recommended_next_steps or [],
            "metadata": mind_map.extra_metadata or {},
            "created_at": mind_map.created_at.isoformat() if mind_map.created_at else None,
        }
    )


@router.post("/student-projects/{project_id}/chat", tags=["Student Projects"])
async def chat_with_project_pdfs(
    project_id: int,
    message: str = Form(...),
    content_id: Optional[int] = Form(None),  # Optional: chat with specific PDF, or all PDFs if None
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Chat with PDFs in a student project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Chat request for project {project_id} from user: {user_id}")
    
    # Verify project exists and belongs to user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get PDF contents
    if content_id:
        # Chat with specific PDF
        contents = db.query(StudentProjectContent).filter(
            StudentProjectContent.id == content_id,
            StudentProjectContent.project_id == project_id,
            StudentProjectContent.content_type == 'pdf'
        ).all()
    else:
        # Chat with all PDFs in the project
        contents = db.query(StudentProjectContent).filter(
            StudentProjectContent.project_id == project_id,
            StudentProjectContent.content_type == 'pdf'
        ).all()
    
    if not contents:
        raise HTTPException(
            status_code=404, 
            detail="No PDFs found in this project" if not content_id else "PDF not found"
        )
    
    # Extract text from all PDFs
    from backend.components.custom_components import PDFTextExtractor
    pdf_extractor = PDFTextExtractor()
    
    all_pdf_text = []
    missing_files = []
    for content in contents:
        if not content.content_url:
            logging.warning(f"[STUDENT PROJECT] PDF has no content_url: {content.name}")
            missing_files.append(content.name)
            continue
            
        if not os.path.exists(content.content_url):
            logging.warning(f"[STUDENT PROJECT] PDF file not found: {content.content_url}")
            missing_files.append(content.name)
            continue
        
        try:
            result = pdf_extractor.run(content.content_url)
            pdf_text = result["text"]
            all_pdf_text.append(f"=== {content.name} ===\n{pdf_text}\n")
        except Exception as e:
            logging.error(f"[STUDENT PROJECT] Error extracting text from {content.name}: {e}")
            missing_files.append(content.name)
            continue
    
    if not all_pdf_text:
        error_msg = "Failed to extract text from PDFs"
        if missing_files:
            error_msg += f". The following PDFs could not be accessed: {', '.join(missing_files)}. Please re-upload them."
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )
    
    if missing_files:
        logging.warning(f"[STUDENT PROJECT] Some PDFs were missing but continuing with available ones: {missing_files}")
    
    # Combine all PDF text
    combined_pdf_text = "\n\n".join(all_pdf_text)
    
    # Call LLM using OpenAI API
    try:
        from openai import OpenAI
        
        # Get API key (support both OPENAI_API_KEY and OPEN_API_KEY for compatibility)
        api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPEN_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="OPENAI_API_KEY environment variable must be set"
            )
        
        # Initialize OpenAI client (default endpoint)
        client = OpenAI(api_key=api_key)
        
        # Get model from environment or use default
        model = os.environ.get("OPENAI_MODEL", "gpt-4.1-2025-04-14")
        
        # Create system message with PDF context
        system_message = f"""You are a helpful assistant that answers questions based on the following PDF content. 
Answer the user's question using only the information provided in the PDFs. If the answer is not in the PDFs, say so.

PDF Content:
{combined_pdf_text}"""
        
        # Call the API with messages format
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content if response.choices else "I'm sorry, I couldn't generate a response."
        
        consume_generation_token(db, current_user)
        db.commit()

        return JSONResponse(
            content={
                "response": response_text,
                "project_id": project_id,
                "content_id": content_id,
                "pdfs_used": [c.name for c in contents]
            },
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except Exception as e:
        logging.error(f"[STUDENT PROJECT] Error calling LLM: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(e)}"
        ) 