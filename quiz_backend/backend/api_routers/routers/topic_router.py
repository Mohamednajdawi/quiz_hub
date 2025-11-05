from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.sqlite_dal import QuizTopic

router = APIRouter()


@router.get("/topics", tags=["Topics"])
async def get_topics(db: Session = Depends(get_db)) -> JSONResponse:
    """Get all quiz topics"""
    topics = db.query(QuizTopic).all()
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


@router.get("/categories", tags=["Topics"])
async def get_categories(db: Session = Depends(get_db)) -> JSONResponse:
    """Get all unique categories with their subcategories"""
    categories = {}
    topics_data = db.query(QuizTopic).all() # Renamed to avoid conflict

    for topic_item in topics_data: # Renamed
        if topic_item.category not in categories:
            categories[topic_item.category] = []

        if topic_item.subcategory not in categories[topic_item.category]:
            categories[topic_item.category].append(topic_item.subcategory)

    return JSONResponse(
        content=categories,
        headers={"Content-Type": "application/json; charset=utf-8"}
    ) 