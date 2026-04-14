"""Deep Scan Bulk Worker – async patent analysis pipeline.

Processes up to 15,000+ patents for a material query with a custom research
directive.  Returns immediately with a scan ID; the heavy lifting runs as a
Celery background task.  Status is polled via Redis.
"""

from __future__ import annotations

import json
import logging
import math
import uuid
from datetime import datetime, timezone

from app.core.security import get_current_user
from app.db.base import get_db
from app.db.models import User
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCAN_TTL_SECONDS = 48 * 3600  # 48 hours

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class DeepScanRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Material query")
    directive: str = Field(
        "", max_length=2000, description="Custom research context / mission"
    )
    max_patents: int = Field(500, ge=1, le=15000, description="Max patents to retrieve")
    email: str = Field("", max_length=320, description="Notification email (optional)")


class DeepScanLaunchResponse(BaseModel):
    scan_id: str
    status: str
    message: str
    estimated_time_minutes: int
    credits_charged: int = 0


class DeepScanStatus(BaseModel):
    scan_id: str
    status: str  # queued | searching | analyzing | generating | completed | failed
    progress: float  # 0.0 – 1.0
    patents_found: int
    patents_analyzed: int
    message: str
    result_url: str | None
    created_at: str


# ---------------------------------------------------------------------------
# Redis helpers
# ---------------------------------------------------------------------------


def _redis():
    """Return the shared Redis client."""
    from app.core.redis_connector import get_redis

    return get_redis()


def _scan_key(scan_id: str) -> str:
    return f"deep_scan:{scan_id}"


def _result_key(scan_id: str) -> str:
    return f"deep_scan_result:{scan_id}"


def _get_scan_meta(scan_id: str) -> dict | None:
    """Read scan metadata from Redis."""
    try:
        raw = _redis().get(_scan_key(scan_id))
        if raw:
            return json.loads(raw)
    except Exception as exc:
        logger.warning("Redis read error for scan %s: %s", scan_id, exc)
    return None


def _set_scan_meta(scan_id: str, meta: dict) -> None:
    """Write scan metadata to Redis with TTL."""
    try:
        _redis().setex(_scan_key(scan_id), SCAN_TTL_SECONDS, json.dumps(meta))
    except Exception as exc:
        logger.warning("Redis write error for scan %s: %s", scan_id, exc)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/launch", response_model=DeepScanLaunchResponse)
async def launch_deep_scan(
    req: DeepScanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Launch an asynchronous deep scan.  Returns immediately with a scan ID."""

    # --- Credit gating (requires auth) ---
    credit_cost = max(1, req.max_patents // 100)
    if user.credits < credit_cost:
        raise HTTPException(
            status_code=402,
            detail="Insufficient credits",
            headers={
                "X-Credits": str(user.credits),
                "X-Required": str(credit_cost),
            },
        )
    from app.api.v1.endpoints.credits import deduct_credits

    deduct_credits(
        db,
        user,
        credit_cost,
        f"Deep Scan: {req.query[:80]} ({req.max_patents} patents)",
    )

    scan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Rough time estimate: ~2 min per 100 patents (search + AI batching)
    estimated_minutes = max(1, math.ceil(req.max_patents / 100) * 2)

    meta = {
        "scan_id": scan_id,
        "status": "queued",
        "progress": 0.0,
        "patents_found": 0,
        "patents_analyzed": 0,
        "message": "Scan queued — waiting for worker.",
        "result_url": None,
        "created_at": now,
        "query": req.query,
        "directive": req.directive,
        "max_patents": req.max_patents,
        "email": req.email,
    }

    _set_scan_meta(scan_id, meta)

    # Dispatch Celery task
    try:
        from app.tasks.deep_scan import run_deep_scan

        run_deep_scan.delay(
            scan_id=scan_id,
            query=req.query,
            directive=req.directive,
            max_patents=req.max_patents,
            email=req.email,
        )
    except Exception as exc:
        logger.error("Failed to dispatch deep scan task: %s", exc, exc_info=True)
        meta["status"] = "failed"
        meta["message"] = "Failed to dispatch background task."
        _set_scan_meta(scan_id, meta)
        raise HTTPException(
            status_code=503, detail="Background worker unavailable."
        ) from exc

    return DeepScanLaunchResponse(
        scan_id=scan_id,
        status="queued",
        message="Deep scan launched. Poll /status for progress.",
        estimated_time_minutes=estimated_minutes,
        credits_charged=credit_cost,
    )


@router.get("/{scan_id}/status", response_model=DeepScanStatus)
async def get_deep_scan_status(scan_id: str):
    """Return current scan status."""

    meta = _get_scan_meta(scan_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Scan not found or expired.")

    return DeepScanStatus(
        scan_id=meta.get("scan_id", scan_id),
        status=meta.get("status", "unknown"),
        progress=meta.get("progress", 0.0),
        patents_found=meta.get("patents_found", 0),
        patents_analyzed=meta.get("patents_analyzed", 0),
        message=meta.get("message", ""),
        result_url=meta.get("result_url"),
        created_at=meta.get("created_at", ""),
    )


@router.get("/{scan_id}/download")
async def download_deep_scan(scan_id: str):
    """Return the completed analysis as structured JSON."""

    meta = _get_scan_meta(scan_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Scan not found or expired.")

    if meta.get("status") != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"Scan is not yet completed (current status: {meta.get('status')}).",
        )

    try:
        raw = _redis().get(_result_key(scan_id))
        if raw is None:
            raise HTTPException(
                status_code=404, detail="Result data expired or missing."
            )
        return json.loads(raw)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to read scan result %s: %s", scan_id, exc, exc_info=True)
        raise HTTPException(
            status_code=500, detail="Error reading scan results."
        ) from exc
