from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import yaml


DEFAULT_CONFIG: Dict[str, Any] = {
    "free_generation_quota": 10,
    "limits": {
        "free_tier": {
            "max_projects": 3,
        },
        "pro_tier": {
            "max_projects": -1,
            "monthly_generations": 200,
        },
    },
    "pricing": {
        "hero": {
            "title": "Simple, transparent pricing",
            "subtitle": "Start for free with {free_generation_quota} AI generations included.",
        },
        "tiers": [],
    },
    "subscriptions": {
        "plans": {},
        "aliases": {},
    },
}


def _deep_merge_dict(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively merge two dictionaries without mutating inputs."""
    merged: Dict[str, Any] = dict(base)
    for key, value in override.items():
        if (
            key in merged
            and isinstance(merged[key], dict)
            and isinstance(value, dict)
        ):
            merged[key] = _deep_merge_dict(merged[key], value)
        else:
            merged[key] = value
    return merged


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
    merged = _deep_merge_dict(DEFAULT_CONFIG, file_config)

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

    subscriptions = merged.get("subscriptions", {}) or {}
    plans = subscriptions.get("plans", {}) or {}
    normalized_plans: Dict[str, Dict[str, Any]] = {}
    for plan_id, plan in plans.items():
        if not isinstance(plan, dict):
            continue
        plan_copy = plan.copy()

        # Normalize numeric pricing (support price or price_cents keys)
        raw_price = plan_copy.get("price_cents", plan_copy.get("price"))
        if raw_price is not None:
            try:
                normalized_price = int(raw_price)
            except (TypeError, ValueError):
                logging.warning("[CONFIG] Invalid price value for plan %s: %r", plan_id, raw_price)
                normalized_price = None
            plan_copy["price_cents"] = normalized_price
            plan_copy["price"] = normalized_price
        else:
            plan_copy["price_cents"] = None
            plan_copy["price"] = None

        # Resolve Stripe price ID
        stripe_price_id = plan_copy.get("stripe_price_id")
        stripe_price_id_env = plan_copy.get("stripe_price_id_env")
        if not stripe_price_id and stripe_price_id_env:
            stripe_price_id = os.getenv(stripe_price_id_env)
        plan_copy["stripe_price_id"] = stripe_price_id

        normalized_plans[str(plan_id)] = plan_copy

    subscriptions["plans"] = normalized_plans

    aliases = subscriptions.get("aliases", {}) or {}
    normalized_aliases: Dict[str, str] = {}
    for alias, target in aliases.items():
        if not isinstance(alias, str) or not isinstance(target, str):
            continue
        normalized_aliases[alias.lower()] = target.lower()
    subscriptions["aliases"] = normalized_aliases

    merged["subscriptions"] = subscriptions
    return merged


def get_free_generation_quota() -> int:
    return get_app_config().get("free_generation_quota", DEFAULT_CONFIG["free_generation_quota"])


def get_pro_generation_limit() -> int:
    config = get_app_config()
    limits = config.get("limits") or {}
    pro_limits = limits.get("pro_tier") or {}
    limit_value = pro_limits.get("monthly_generations")

    try:
        if limit_value is None:
            raise ValueError("missing pro tier monthly_generations")
        return int(limit_value)
    except (TypeError, ValueError):
        default_limits = DEFAULT_CONFIG.get("limits", {}).get("pro_tier", {})
        return int(default_limits.get("monthly_generations", 200))


def get_subscription_plans_config() -> Dict[str, Dict[str, Any]]:
    config = get_app_config()
    subscriptions = config.get("subscriptions") or {}
    plans = subscriptions.get("plans") or {}
    return plans


def get_subscription_plan_alias_map() -> Dict[str, str]:
    plans = get_subscription_plans_config()
    config = get_app_config()
    aliases = (config.get("subscriptions") or {}).get("aliases") or {}
    alias_map: Dict[str, str] = {}

    for alias, canonical in aliases.items():
        if canonical in plans:
            alias_map[alias.lower()] = canonical

    # Ensure canonical names resolve to themselves
    for plan_id in plans:
        alias_map.setdefault(plan_id.lower(), plan_id)

    return alias_map


def resolve_subscription_plan_id(identifier: Optional[str]) -> Optional[str]:
    if not identifier:
        return None
    alias_map = get_subscription_plan_alias_map()
    return alias_map.get(identifier.lower())


def get_subscription_plan_by_price_id(price_id: Optional[str]) -> Optional[Tuple[str, Dict[str, Any]]]:
    if not price_id:
        return None
    plans = get_subscription_plans_config()
    for plan_id, plan in plans.items():
        if plan.get("stripe_price_id") == price_id:
            return plan_id, plan
    return None


def get_pdf_storage_dir() -> str:
    """
    Determine a writable directory for storing PDF files.

    Preference order:
    1. Explicit `PDF_STORAGE_DIR` environment variable
    2. Railway volume under `/app/data/student_project_pdfs`
    3. Local project directory (`./student_project_pdfs`)
    """

    # Helper to validate and create candidate directories
    def _ensure_dir(path: str) -> str | None:
        try:
            os.makedirs(path, exist_ok=True)
        except PermissionError:
            logging.warning("[PDF STORAGE] Permission denied when creating directory: %s", path)
            return None
        except OSError as exc:
            logging.warning("[PDF STORAGE] Unable to create directory %s: %s", path, exc)
            return None

        if os.access(path, os.W_OK):
            return path

        logging.warning("[PDF STORAGE] Directory exists but is not writable: %s", path)
        return None

    candidates = []

    # Highest priority: explicit override
    env_override = os.getenv("PDF_STORAGE_DIR")
    if env_override:
        candidates.append(env_override)

    # Railway volume (if mounted)
    railway_volume = "/app/data"
    if os.path.isdir(railway_volume):
        candidates.append(os.path.join(railway_volume, "student_project_pdfs"))

    # Local development fallback
    candidates.append(os.path.join(os.getcwd(), "student_project_pdfs"))

    for candidate in candidates:
        ensured = _ensure_dir(candidate)
        if ensured:
            logging.debug("[PDF STORAGE] Using directory: %s", ensured)
            return ensured

    raise RuntimeError(
        "Unable to locate a writable directory for PDF storage. "
        "Set PDF_STORAGE_DIR environment variable to a writable path."
    )
