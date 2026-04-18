"""Google Places (v1) proxy with session tokens, Redis cache, DB fallback.

Design goals:
    1. **Cost control.** Session tokens bundle all autocomplete calls in one
       user-typing session + the final details lookup into a single
       Autocomplete Session billing SKU (~$0.017) instead of paying per
       keystroke. Field masks request ONLY the essentials — anything under
       the `Essentials` SKU is free. Redis cache deduplicates identical
       text queries for 7 days. The CachedPlace DB table gives us a
       permanent fallback so repeated hits on the same place never bill.

    2. **Performance.** All calls are async (httpx). Client-side debounce
       (300 ms) is expected. Redis-level cache serves hits in <5 ms.

    3. **Reliability.** If the Google API is missing / rate-limited /
       errors, we fall back to an ILIKE search on ``cached_places``. The
       UI never sees an empty state for a previously-known place.

    4. **Graceful degradation.** If ``GOOGLE_PLACES_API_KEY`` is unset
       (not yet created in Secret Manager), endpoints return empty lists
       and a 503 hint, but never 500. Frontend collapses to a plain text
       input.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any, Optional

import httpx
from app.db.base import get_db
from app.db.models import CachedPlace
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()

GOOGLE_PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
PLACES_BASE_URL = "https://places.googleapis.com/v1"

# Minimum field mask — the cheapest tier ("Essentials", free under
# Autocomplete Session billing). Adding Contact/Atmosphere fields bumps
# the bill to the Pro/Enterprise SKU.
AUTOCOMPLETE_FIELD_MASK = (
    "suggestions.placePrediction.placeId,"
    "suggestions.placePrediction.text,"
    "suggestions.placePrediction.structuredFormat"
)
DETAILS_FIELD_MASK = "id,displayName,formattedAddress,location"

# Redis cache TTLs. 7 days is the Google caching-policy max for place
# details; keeps us inside ToS.
AUTOCOMPLETE_TTL = 60 * 60 * 24 * 7
DETAILS_TTL = 60 * 60 * 24 * 7


# ---------------------------------------------------------------------------
# Redis helpers — optional, falls through silently if unavailable.
# ---------------------------------------------------------------------------


def _redis_client():
    try:
        from app.core.redis_connector import get_redis

        return get_redis()
    except Exception:
        return None


async def _cache_get(key: str) -> Optional[Any]:
    r = _redis_client()
    if not r:
        return None
    try:
        raw = await asyncio.to_thread(r.get, key)
        return json.loads(raw) if raw else None
    except Exception as exc:
        logger.warning("places redis get failed: %s", exc)
        return None


async def _cache_set(key: str, value: Any, ttl: int) -> None:
    r = _redis_client()
    if not r:
        return
    try:
        await asyncio.to_thread(r.setex, key, ttl, json.dumps(value))
    except Exception as exc:
        logger.warning("places redis set failed: %s", exc)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class AutocompleteRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    session_token: str = Field(..., min_length=8, max_length=128)
    language: str = Field("en", min_length=2, max_length=5)


class AutocompleteSuggestion(BaseModel):
    place_id: str
    text: str
    main_text: str
    secondary_text: str


class AutocompleteResponse(BaseModel):
    suggestions: list[AutocompleteSuggestion]
    source: str  # "google" | "cache" | "db_fallback" | "disabled"


class DetailsRequest(BaseModel):
    place_id: str = Field(..., min_length=3, max_length=255)
    session_token: str = Field(..., min_length=8, max_length=128)
    language: str = Field("en", min_length=2, max_length=5)


class PlaceDetails(BaseModel):
    place_id: str
    display_name: str
    formatted_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DetailsResponse(BaseModel):
    place: PlaceDetails
    source: str  # "google" | "db_fallback" | "cache"


# ---------------------------------------------------------------------------
# Fallback — ILIKE search on CachedPlace.
# ---------------------------------------------------------------------------


def _fallback_suggestions(
    db: Session, query: str, limit: int = 6
) -> list[AutocompleteSuggestion]:
    needle = f"%{query.lower().strip()}%"
    rows = (
        db.query(CachedPlace)
        .filter(CachedPlace.normalized.ilike(needle))
        .order_by(CachedPlace.use_count.desc(), CachedPlace.last_used_at.desc())
        .limit(limit)
        .all()
    )
    return [
        AutocompleteSuggestion(
            place_id=r.place_id,
            text=f"{r.display_name} · {r.formatted_address}",
            main_text=r.display_name,
            secondary_text=r.formatted_address,
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete(
    body: AutocompleteRequest,
    db: Session = Depends(get_db),
):
    """Autocomplete predictions for a free-text location query.

    The client generates one session_token per typing session (e.g., a
    UUID v4 on component mount, reset after a final selection) and
    passes the same token for every keystroke **and** the final Details
    call. Google bills the whole session as a single Autocomplete
    Session SKU regardless of how many autocomplete calls happen in
    between.
    """
    cache_key = (
        f"places:autocomplete:v1:{body.language}:{body.query.lower().strip()}"
    )

    # 1. Redis cache — deduplicates identical text across sessions.
    cached = await _cache_get(cache_key)
    if cached is not None:
        return AutocompleteResponse(
            suggestions=[AutocompleteSuggestion(**s) for s in cached],
            source="cache",
        )

    # 2. Google Places (primary).
    if GOOGLE_PLACES_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{PLACES_BASE_URL}/places:autocomplete",
                    headers={
                        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                        "X-Goog-FieldMask": AUTOCOMPLETE_FIELD_MASK,
                        "Content-Type": "application/json",
                    },
                    json={
                        "input": body.query,
                        "sessionToken": body.session_token,
                        "languageCode": body.language,
                    },
                )
            if resp.status_code == 200:
                data = resp.json()
                suggestions = [
                    AutocompleteSuggestion(
                        place_id=s["placePrediction"]["placeId"],
                        text=s["placePrediction"]["text"].get("text", ""),
                        main_text=s["placePrediction"]
                        .get("structuredFormat", {})
                        .get("mainText", {})
                        .get("text", s["placePrediction"]["text"].get("text", "")),
                        secondary_text=s["placePrediction"]
                        .get("structuredFormat", {})
                        .get("secondaryText", {})
                        .get("text", ""),
                    )
                    for s in data.get("suggestions", [])
                    if "placePrediction" in s
                ]
                await _cache_set(
                    cache_key,
                    [s.model_dump() for s in suggestions],
                    AUTOCOMPLETE_TTL,
                )
                return AutocompleteResponse(suggestions=suggestions, source="google")
            logger.warning(
                "places autocomplete non-200: %s %s",
                resp.status_code,
                resp.text[:200],
            )
        except Exception as exc:
            logger.warning("places autocomplete network error: %s", exc)

    # 3. DB fallback (serves known places even if Google is unreachable).
    fallback = _fallback_suggestions(db, body.query)
    if fallback:
        return AutocompleteResponse(
            suggestions=fallback,
            source="db_fallback" if GOOGLE_PLACES_API_KEY else "disabled",
        )

    return AutocompleteResponse(
        suggestions=[],
        source="disabled" if not GOOGLE_PLACES_API_KEY else "db_fallback",
    )


@router.post("/details", response_model=DetailsResponse)
async def details(
    body: DetailsRequest,
    db: Session = Depends(get_db),
):
    """Resolve a place_id to full details.

    Called exactly once per typing session after the user selects a
    suggestion. Reuses the session_token from autocomplete so the whole
    exchange bills as a single Autocomplete Session.
    """
    # 1. DB cache — permanent, zero cost.
    existing = (
        db.query(CachedPlace).filter(CachedPlace.place_id == body.place_id).first()
    )
    if existing:
        existing.use_count = (existing.use_count or 0) + 1
        db.commit()
        return DetailsResponse(
            place=PlaceDetails(
                place_id=existing.place_id,
                display_name=existing.display_name,
                formatted_address=existing.formatted_address,
                latitude=existing.latitude,
                longitude=existing.longitude,
            ),
            source="cache",
        )

    # 2. Google Places (primary).
    if GOOGLE_PLACES_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{PLACES_BASE_URL}/places/{body.place_id}",
                    headers={
                        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
                    },
                    params={
                        "sessionToken": body.session_token,
                        "languageCode": body.language,
                    },
                )
            if resp.status_code == 200:
                data = resp.json()
                display_name = data.get("displayName", {}).get("text", "")
                formatted = data.get("formattedAddress", "")
                loc = data.get("location") or {}
                place = CachedPlace(
                    place_id=data.get("id", body.place_id),
                    display_name=display_name,
                    formatted_address=formatted,
                    normalized=f"{display_name} {formatted}".lower(),
                    latitude=loc.get("latitude"),
                    longitude=loc.get("longitude"),
                    raw_json=data,
                )
                db.add(place)
                try:
                    db.commit()
                except IntegrityError:
                    db.rollback()  # concurrent insert — benign
                return DetailsResponse(
                    place=PlaceDetails(
                        place_id=place.place_id,
                        display_name=place.display_name,
                        formatted_address=place.formatted_address,
                        latitude=place.latitude,
                        longitude=place.longitude,
                    ),
                    source="google",
                )
            logger.warning(
                "places details non-200: %s %s", resp.status_code, resp.text[:200]
            )
        except Exception as exc:
            logger.warning("places details network error: %s", exc)

    raise HTTPException(
        status_code=503,
        detail=(
            "Google Places is unavailable and no cached record exists for this "
            "place_id. Try typing the full address manually."
        ),
    )
