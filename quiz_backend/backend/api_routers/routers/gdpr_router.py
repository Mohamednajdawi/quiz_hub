"""
GDPR Data Subject Rights API Router

Implements Articles 12-23 GDPR:
- Article 15: Right of access
- Article 16: Right to rectification
- Article 17: Right to erasure ("right to be forgotten")
- Article 18: Right to restriction of processing
- Article 20: Right to data portability
- Article 21: Right to object

Required for BMB compliance (Clause 11).
"""

import logging
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from backend.database.db import get_db
from backend.database.sqlite_dal import (
    QuizTopic,
    QuizQuestion,
    QuizAttempt,
    FlashcardTopic,
    FlashcardCard,
    EssayQATopic,
    EssayAnswer,
    StudentProject,
    StudentProjectContent,
    MindMap,
    Subscription,
    PaymentMethod,
    Transaction,
    Referral,
    TokenUsage,
    GenerationJob,
    User as UserModel,
)
from backend.api_routers.routers.auth_router import get_current_user_dependency
from backend.utils.admin import get_user_token_usage

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/gdpr/data-access", tags=["GDPR"])
async def get_data_access(
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Article 15 GDPR: Right of access
    
    Returns all personal data held about the user.
    """
    user_id = current_user.id
    
    try:
        # Get user basic data
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Collect all user data
        user_data = {
            "user_id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "birth_date": user.birth_date.isoformat() if user.birth_date else None,
            "gender": user.gender,
            "is_active": user.is_active,
            "free_tokens": user.free_tokens,
            "referral_code": user.referral_code,
            "referred_by_code": user.referred_by_code,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
        
        # Get subscriptions
        subscriptions = db.query(Subscription).filter(Subscription.user_id == user_id).all()
        user_data["subscriptions"] = [
            {
                "id": sub.id,
                "plan_type": sub.plan_type,
                "status": sub.status,
                "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
                "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
                "created_at": sub.created_at.isoformat() if sub.created_at else None,
            }
            for sub in subscriptions
        ]
        
        # Get payment methods
        payment_methods = db.query(PaymentMethod).filter(PaymentMethod.user_id == user_id).all()
        user_data["payment_methods"] = [
            {
                "id": pm.id,
                "type": pm.type,
                "last4": pm.last4,
                "brand": pm.brand,
                "exp_month": pm.exp_month,
                "exp_year": pm.exp_year,
                "created_at": pm.created_at.isoformat() if pm.created_at else None,
            }
            for pm in payment_methods
        ]
        
        # Get transactions
        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        user_data["transactions"] = [
            {
                "id": txn.id,
                "amount": float(txn.amount),
                "currency": txn.currency,
                "status": txn.status,
                "description": txn.description,
                "created_at": txn.created_at.isoformat() if txn.created_at else None,
            }
            for txn in transactions
        ]
        
        # Get quiz attempts
        quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).all()
        user_data["quiz_attempts"] = [
            {
                "id": attempt.id,
                "topic_id": attempt.topic_id,
                "score": attempt.score,
                "total_questions": attempt.total_questions,
                "percentage_score": float(attempt.percentage_score),
                "time_taken_seconds": attempt.time_taken_seconds,
                "timestamp": attempt.timestamp.isoformat() if attempt.timestamp else None,
                "difficulty_level": attempt.difficulty_level,
            }
            for attempt in quiz_attempts
        ]
        
        # Get quiz topics created
        quiz_topics = db.query(QuizTopic).filter(QuizTopic.created_by_user_id == user_id).all()
        user_data["quiz_topics_created"] = [
            {
                "id": topic.id,
                "topic": topic.topic,
                "category": topic.category,
                "subcategory": topic.subcategory,
                "difficulty": topic.difficulty,
                "creation_timestamp": topic.creation_timestamp.isoformat() if topic.creation_timestamp else None,
            }
            for topic in quiz_topics
        ]
        
        # Get flashcard topics
        flashcard_topics = db.query(FlashcardTopic).filter(FlashcardTopic.created_by_user_id == user_id).all()
        user_data["flashcard_topics"] = [
            {
                "id": topic.id,
                "topic": topic.topic,
                "category": topic.category,
                "subcategory": topic.subcategory,
                "created_at": topic.created_at.isoformat() if topic.created_at else None,
            }
            for topic in flashcard_topics
        ]
        
        # Get essay topics
        essay_topics = db.query(EssayQATopic).filter(EssayQATopic.created_by_user_id == user_id).all()
        user_data["essay_topics"] = [
            {
                "id": topic.id,
                "topic": topic.topic,
                "category": topic.category,
                "subcategory": topic.subcategory,
                "created_at": topic.created_at.isoformat() if topic.created_at else None,
            }
            for topic in essay_topics
        ]
        
        # Get student projects
        projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).all()
        user_data["student_projects"] = [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "created_at": project.created_at.isoformat() if project.created_at else None,
                "updated_at": project.updated_at.isoformat() if project.updated_at else None,
            }
            for project in projects
        ]
        
        # Get mind maps
        mind_maps = db.query(MindMap).filter(MindMap.user_id == user_id).all()
        user_data["mind_maps"] = [
            {
                "id": mm.id,
                "title": mm.title,
                "category": mm.category,
                "subcategory": mm.subcategory,
                "created_at": mm.created_at.isoformat() if mm.created_at else None,
            }
            for mm in mind_maps
        ]
        
        # Get token usage
        token_usage = get_user_token_usage(db, user_id)
        user_data["token_usage"] = token_usage
        
        # Get generation jobs
        generation_jobs = db.query(GenerationJob).filter(GenerationJob.user_id == user_id).all()
        user_data["generation_jobs"] = [
            {
                "id": job.id,
                "job_type": job.job_type,
                "status": job.status,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            }
            for job in generation_jobs
        ]
        
        # Get referrals
        referrals_sent = db.query(Referral).filter(Referral.referrer_id == user_id).all()
        user_data["referrals_sent"] = [
            {
                "id": ref.id,
                "referred_id": ref.referred_id,
                "status": ref.status,
                "created_at": ref.created_at.isoformat() if ref.created_at else None,
            }
            for ref in referrals_sent
        ]
        
        logger.info(f"[GDPR] Data access request for user {user_id}")
        
        return JSONResponse(
            content={
                "message": "Data access request completed",
                "requested_at": datetime.now().isoformat(),
                "data": user_data,
            },
            status_code=200
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GDPR] Error processing data access request: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing data access request: {str(e)}"
        )


@router.put("/gdpr/data-rectification", tags=["GDPR"])
async def update_data_rectification(
    update_data: Dict[str, Any],
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Article 16 GDPR: Right to rectification
    
    Allows user to correct inaccurate personal data.
    """
    user_id = current_user.id
    
    try:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update allowed fields
        allowed_fields = ["first_name", "last_name", "birth_date", "gender", "email"]
        updated_fields = []
        
        for field in allowed_fields:
            if field in update_data:
                if field == "birth_date" and isinstance(update_data[field], str):
                    from datetime import datetime as dt
                    update_data[field] = dt.fromisoformat(update_data[field]).date()
                
                setattr(user, field, update_data[field])
                updated_fields.append(field)
        
        if updated_fields:
            user.updated_at = datetime.now()
            db.commit()
            db.refresh(user)
            
            logger.info(f"[GDPR] Data rectification for user {user_id}, updated fields: {updated_fields}")
            
            return JSONResponse(
                content={
                    "message": "Data updated successfully",
                    "updated_fields": updated_fields,
                    "updated_at": user.updated_at.isoformat(),
                },
                status_code=200
            )
        else:
            return JSONResponse(
                content={
                    "message": "No valid fields to update",
                },
                status_code=400
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GDPR] Error processing data rectification: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing data rectification: {str(e)}"
        )


@router.post("/gdpr/data-export", tags=["GDPR"])
async def export_data_portability(
    format: str = "json",
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> Response:
    """
    Article 20 GDPR: Right to data portability
    
    Exports user data in a machine-readable format (JSON or CSV).
    """
    user_id = current_user.id
    
    try:
        # Get all user data by calling the data access endpoint logic directly
        user_id = current_user.id
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Collect all user data (same as get_data_access but return dict directly)
        data = {
            "user_id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "birth_date": user.birth_date.isoformat() if user.birth_date else None,
            "gender": user.gender,
            "is_active": user.is_active,
            "free_tokens": user.free_tokens,
            "referral_code": user.referral_code,
            "referred_by_code": user.referred_by_code,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
        
        # Get all related data (simplified for export)
        subscriptions = db.query(Subscription).filter(Subscription.user_id == user_id).all()
        data["subscriptions"] = [{"id": s.id, "plan_type": s.plan_type, "status": s.status} for s in subscriptions]
        
        quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).all()
        data["quiz_attempts"] = [{"id": a.id, "score": a.score, "total_questions": a.total_questions} for a in quiz_attempts]
        
        projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).all()
        data["student_projects"] = [{"id": p.id, "name": p.name} for p in projects]
        
        if format.lower() == "json":
            # Return as JSON file
            json_str = json.dumps(data, indent=2, default=str)
            return Response(
                content=json_str,
                media_type="application/json",
                headers={
                    "Content-Disposition": f'attachment; filename="progrezz_data_export_{user_id}_{datetime.now().strftime("%Y%m%d")}.json"'
                }
            )
        elif format.lower() == "csv":
            # Convert to CSV (simplified - would need proper CSV library for complex nested data)
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write user basic data
            writer.writerow(["Field", "Value"])
            writer.writerow(["user_id", data.get("user_id")])
            writer.writerow(["email", data.get("email")])
            writer.writerow(["first_name", data.get("first_name")])
            writer.writerow(["last_name", data.get("last_name")])
            # ... more fields
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f'attachment; filename="progrezz_data_export_{user_id}_{datetime.now().strftime("%Y%m%d")}.csv"'
                }
            )
        else:
            raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GDPR] Error exporting user data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error exporting user data: {str(e)}"
        )


@router.delete("/gdpr/data-erasure", tags=["GDPR"])
async def delete_data_erasure(
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Article 17 GDPR: Right to erasure ("right to be forgotten")
    
    Deletes all user data. This is irreversible.
    
    Note: Some data may be retained if required by law (e.g., financial records).
    """
    user_id = current_user.id
    
    try:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.warning(f"[GDPR] Data erasure request for user {user_id}")
        
        # Delete in order to respect foreign key constraints
        
        # 1. Delete generation jobs
        db.query(GenerationJob).filter(GenerationJob.user_id == user_id).delete()
        
        # 2. Delete token usage records
        db.query(TokenUsage).filter(TokenUsage.user_id == user_id).delete()
        
        # 3. Delete referrals
        db.query(Referral).filter(
            or_(Referral.referrer_id == user_id, Referral.referred_id == user_id)
        ).delete()
        
        # 4. Delete mind maps
        mind_maps = db.query(MindMap).filter(MindMap.user_id == user_id).all()
        for mm in mind_maps:
            # Delete references
            from backend.database.sqlite_dal import StudentProjectMindMapReference
            db.query(StudentProjectMindMapReference).filter(
                StudentProjectMindMapReference.mind_map_id == mm.id
            ).delete()
        db.query(MindMap).filter(MindMap.user_id == user_id).delete()
        
        # 5. Delete student projects and their content
        projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).all()
        for project in projects:
            # Delete project content and files
            contents = db.query(StudentProjectContent).filter(
                StudentProjectContent.project_id == project.id
            ).all()
            for content in contents:
                # Delete PDF files from disk
                import os
                if content.content_url and os.path.exists(content.content_url):
                    try:
                        os.remove(content.content_url)
                    except Exception as e:
                        logger.warning(f"[GDPR] Could not delete file {content.content_url}: {e}")
                
                # Delete references
                from backend.database.sqlite_dal import (
                    StudentProjectQuizReference,
                    StudentProjectFlashcardReference,
                    StudentProjectEssayReference,
                    StudentProjectMindMapReference,
                )
                db.query(StudentProjectQuizReference).filter(
                    StudentProjectQuizReference.content_id == content.id
                ).delete()
                db.query(StudentProjectFlashcardReference).filter(
                    StudentProjectFlashcardReference.content_id == content.id
                ).delete()
                db.query(StudentProjectEssayReference).filter(
                    StudentProjectEssayReference.content_id == content.id
                ).delete()
                db.query(StudentProjectMindMapReference).filter(
                    StudentProjectMindMapReference.content_id == content.id
                ).delete()
            
            db.query(StudentProjectContent).filter(
                StudentProjectContent.project_id == project.id
            ).delete()
        
        db.query(StudentProject).filter(StudentProject.user_id == user_id).delete()
        
        # 6. Delete essay answers
        db.query(EssayAnswer).filter(EssayAnswer.user_id == user_id).delete()
        
        # 7. Delete essay topics created by user
        essay_topics = db.query(EssayQATopic).filter(EssayQATopic.created_by_user_id == user_id).all()
        for topic in essay_topics:
            db.query(EssayAnswer).filter(EssayAnswer.essay_topic_id == topic.id).delete()
        db.query(EssayQATopic).filter(EssayQATopic.created_by_user_id == user_id).delete()
        
        # 8. Delete flashcard topics created by user
        from backend.database.sqlite_dal import FlashcardCard
        flashcard_topics = db.query(FlashcardTopic).filter(FlashcardTopic.created_by_user_id == user_id).all()
        for topic in flashcard_topics:
            db.query(FlashcardCard).filter(FlashcardCard.topic_id == topic.id).delete()
        db.query(FlashcardTopic).filter(FlashcardTopic.created_by_user_id == user_id).delete()
        
        # 9. Delete quiz attempts
        db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).delete()
        
        # 10. Delete quiz topics created by user
        quiz_topics = db.query(QuizTopic).filter(QuizTopic.created_by_user_id == user_id).all()
        for topic in quiz_topics:
            db.query(QuizQuestion).filter(QuizQuestion.topic_id == topic.id).delete()
            db.query(QuizAttempt).filter(QuizAttempt.topic_id == topic.id).delete()
        db.query(QuizTopic).filter(QuizTopic.created_by_user_id == user_id).delete()
        
        # 11. Cancel and delete subscriptions (but keep transaction records for legal compliance)
        db.query(Subscription).filter(Subscription.user_id == user_id).update({
            "status": "canceled"
        })
        
        # 12. Delete payment methods
        db.query(PaymentMethod).filter(PaymentMethod.user_id == user_id).delete()
        
        # 13. Anonymize user account (keep for legal/accounting purposes but remove personal data)
        user.email = f"deleted_{user_id}@deleted.local"
        user.first_name = None
        user.last_name = None
        user.birth_date = None
        user.gender = None
        user.is_active = False
        user.password_hash = None
        user.firebase_uid = None
        user.referral_code = None
        user.referred_by_code = None
        user.updated_at = datetime.now()
        
        # Note: Transactions are kept for legal/accounting compliance but user is anonymized
        
        db.commit()
        
        logger.warning(f"[GDPR] Data erasure completed for user {user_id}")
        
        return JSONResponse(
            content={
                "message": "Data erasure completed. Your account has been anonymized and most data deleted. Some financial records may be retained for legal compliance.",
                "erased_at": datetime.now().isoformat(),
                "note": "Financial transaction records may be retained as required by law.",
            },
            status_code=200
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GDPR] Error processing data erasure: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing data erasure: {str(e)}"
        )


@router.post("/gdpr/processing-restriction", tags=["GDPR"])
async def restrict_processing(
    restriction_reason: str,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Article 18 GDPR: Right to restriction of processing
    
    Temporarily restricts processing of user data while dispute is resolved.
    """
    user_id = current_user.id
    
    try:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mark user as restricted (using is_active flag or add new field)
        # For now, we'll deactivate the account
        user.is_active = False
        user.updated_at = datetime.now()
        
        # Store restriction reason (would need new column or use a separate table)
        # For now, we'll log it
        logger.warning(f"[GDPR] Processing restriction for user {user_id}: {restriction_reason}")
        
        db.commit()
        
        return JSONResponse(
            content={
                "message": "Processing restriction applied. Your account has been deactivated.",
                "restricted_at": datetime.now().isoformat(),
                "reason": restriction_reason,
            },
            status_code=200
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GDPR] Error processing restriction request: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing restriction request: {str(e)}"
        )


@router.post("/gdpr/object-processing", tags=["GDPR"])
async def object_to_processing(
    objection_reason: str,
    processing_purpose: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Article 21 GDPR: Right to object to processing
    
    Allows user to object to processing of their personal data.
    """
    user_id = current_user.id
    
    try:
        # Log the objection
        logger.warning(f"[GDPR] Processing objection from user {user_id}: {objection_reason}, purpose: {processing_purpose}")
        
        # In a full implementation, this would:
        # 1. Store the objection in a database
        # 2. Stop processing for the specified purpose
        # 3. Notify relevant systems
        
        # For now, we'll deactivate the account as a simple implementation
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.is_active = False
        user.updated_at = datetime.now()
        db.commit()
        
        return JSONResponse(
            content={
                "message": "Objection to processing recorded. Your account has been deactivated.",
                "objected_at": datetime.now().isoformat(),
                "reason": objection_reason,
                "processing_purpose": processing_purpose,
            },
            status_code=200
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GDPR] Error processing objection: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing objection: {str(e)}"
        )

