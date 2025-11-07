from fastapi import APIRouter

from backend.config import get_app_config


router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get("/app")
async def read_app_config() -> dict:
    return get_app_config()


@router.get("/pricing")
async def read_pricing_config() -> dict:
    config = get_app_config()
    return config.get("pricing", {})

