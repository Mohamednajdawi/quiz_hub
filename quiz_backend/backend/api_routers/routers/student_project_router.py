import logging
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

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
    User,
    QuizTopic,
    FlashcardTopic,
    EssayQATopic,
    Subscription
)
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.utils.credits import consume_generation_token
from backend.database.sqlite_dal import User as UserModel
from backend.config.settings import get_app_config, get_pdf_storage_dir

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
            "essay_references": [ref.essay_topic_id for ref in essay_refs]
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
        "essay_references": [ref.essay_topic_id for ref in essay_refs]
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
    pdf_file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """Add PDF content to a student project"""
    user_id = current_user.id
    logging.warning(f"[STUDENT PROJECT] Adding content to project {project_id} for user: {user_id}")
    
    # Verify the project exists and belongs to the user
    project = db.query(StudentProject).filter(
        StudentProject.id == project_id,
        StudentProject.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Handle PDF file upload
    import shutil
    import uuid
    
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
        raise HTTPException(
            status_code=400, 
            detail=f"Only PDF files are accepted. Received: filename='{filename}', content_type='{content_type}'"
        )
    
    # Get persistent storage directory for PDFs (uses Railway volume if available)
    storage_dir = get_pdf_storage_dir()
    
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
    db.commit()
    db.refresh(content)
    
    return JSONResponse(
        content={
            "message": "Content added successfully",
            "content": {
                "id": content.id,
                "content_type": content.content_type,
                "name": content.name,
                "content_url": content.content_url,
                "file_size": content.file_size,
                "uploaded_at": content.uploaded_at.isoformat()
            }
        },
        status_code=201
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
            from backend.database.sqlite_dal import QuizQuestion
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
    
    return JSONResponse(
        content={
            "project_id": project_id,
            "project_name": project.name,
            "quizzes": quizzes,
            "flashcards": flashcards,
            "essays": essays,
            "total_quizzes": len(quizzes),
            "total_flashcards": len(flashcards),
            "total_essays": len(essays)
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
            from backend.database.sqlite_dal import QuizQuestion
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
    
    return JSONResponse(
        content={
            "project_id": project_id,
            "content_id": content_id,
            "content_name": content.name,
            "content_type": content.content_type,
            "quizzes": quizzes,
            "flashcards": flashcards,
            "essays": essays,
            "total_quizzes": len(quizzes),
            "total_flashcards": len(flashcards),
            "total_essays": len(essays)
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
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