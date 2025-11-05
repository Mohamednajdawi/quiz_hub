import logging
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
    EssayQATopic
)
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.database.sqlite_dal import User as UserModel

router = APIRouter()


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
    import tempfile
    import shutil
    import os
    
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
    
    # Save file temporarily to get size
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        shutil.copyfileobj(pdf_file.file, temp_file)
        temp_file_path = temp_file.name
        file_size = os.path.getsize(temp_file_path)
    
    # Create content entry
    content = StudentProjectContent(
        project_id=project_id,
        content_type='pdf',
        name=pdf_file.filename or 'uploaded_file.pdf',
        content_url=temp_file_path,  # Store path temporarily (in production, upload to storage)
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