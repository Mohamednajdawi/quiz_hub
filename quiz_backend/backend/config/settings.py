from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

import yaml


DEFAULT_CONFIG: Dict[str, Any] = {
    "free_generation_quota": 10,
    "pricing": {
        "hero": {
            "title": "Simple, transparent pricing",
            "subtitle": "Start for free with {free_generation_quota} AI generations included.",
        },
        "tiers": [],
    },
}


def _default_config_path() -> Path:
    return Path(__file__).resolve().parents[2] / "config" / "app_config.yaml"


def _load_yaml_config(config_path: Path) -> Dict[str, Any]:
    if not config_path.exists():
        return {}
    with config_path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
        if not isinstance(data, dict):
            return {}
        return data


@lru_cache()
def get_app_config() -> Dict[str, Any]:
    path_override = os.getenv("APP_CONFIG_PATH")
    config_path = Path(path_override) if path_override else _default_config_path()

    file_config = _load_yaml_config(config_path)
    merged = {**DEFAULT_CONFIG, **file_config}

    quota = merged.get("free_generation_quota", DEFAULT_CONFIG["free_generation_quota"])
    try:
        merged["free_generation_quota"] = int(quota)
    except (TypeError, ValueError):
        merged["free_generation_quota"] = DEFAULT_CONFIG["free_generation_quota"]

    pricing = merged.get("pricing", {}) or {}
    hero = pricing.get("hero", {}) or {}
    hero_subtitle = hero.get("subtitle")
    if isinstance(hero_subtitle, str):
        hero["subtitle"] = hero_subtitle.format(free_generation_quota=merged["free_generation_quota"])
    pricing["hero"] = hero

    tiers = pricing.get("tiers", []) or []
    normalized_tiers = []
    for tier in tiers:
        if isinstance(tier, dict):
            tier_copy = tier.copy()
            for key in ("description", "tagline"):
                value = tier_copy.get(key)
                if isinstance(value, str):
                    tier_copy[key] = value.format(free_generation_quota=merged["free_generation_quota"])
            features = tier_copy.get("features")
            if isinstance(features, list):
                tier_copy["features"] = [
                    feature.format(free_generation_quota=merged["free_generation_quota"])
                    if isinstance(feature, str)
                    else feature
                    for feature in features
                ]
            normalized_tiers.append(tier_copy)
    pricing["tiers"] = normalized_tiers

    merged["pricing"] = pricing
    return merged


def get_free_generation_quota() -> int:
    return get_app_config().get("free_generation_quota", DEFAULT_CONFIG["free_generation_quota"])


def get_pdf_storage_dir() -> str:
    """
    Get the directory path for storing PDF files.
    Uses Railway volume at /app/data if it exists, otherwise falls back to local storage.
    """
    # Check if Railway volume exists
    railway_volume = "/app/data"
    if os.path.exists(railway_volume) and os.path.isdir(railway_volume):
        storage_dir = os.path.join(railway_volume, "student_project_pdfs")
    else:
        # Fallback to local storage for development
        storage_dir = os.path.join(os.getcwd(), "student_project_pdfs")
    
    # Ensure directory exists
    os.makedirs(storage_dir, exist_ok=True)
    return storage_dir
