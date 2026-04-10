"""Health check endpoints."""

from __future__ import annotations

import logging
import threading

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.base import check_connection, get_db

logger = logging.getLogger(__name__)
router = APIRouter()

_ingestion_triggered = False
_ingestion_lock = threading.Lock()


@router.get("/health/live")
async def liveness():
    """Lightweight liveness probe for Kubernetes."""
    return {"status": "ok"}


@router.get("/health/full")
async def full_health(db: Session = Depends(get_db)):
    """Comprehensive health check including DB, Redis, and Celery."""
    db_ok = check_connection()

    redis_ok = False
    try:
        from app.core.redis_connector import get_redis

        r = get_redis()
        r.ping()
        redis_ok = True
    except Exception:
        pass

    celery_ok = False
    celery_workers = 0
    try:
        from app.tasks.celery_app import celery_app

        inspect = celery_app.control.inspect(timeout=2.0)
        active = inspect.active()
        if active is not None:
            celery_ok = True
            celery_workers = len(active)
    except Exception:
        pass

    engine_version = "unknown"
    try:
        import materia
        engine_version = getattr(materia, "__version__", "1.0.0")
    except ImportError:
        engine_version = "1.0.0"

    # DB stats
    db_stats = {}
    try:
        from app.db.models import Campaign, MaterialRecord, User

        db_stats["users"] = db.query(User).count()
        db_stats["campaigns"] = db.query(Campaign).count()
        db_stats["materials"] = db.query(MaterialRecord).count()
    except Exception:
        pass

    # Trigger real data ingestion on first health check (lazy init)
    ingestion_status = _maybe_trigger_ingestion(db)

    overall = db_ok and redis_ok
    return {
        "status": "healthy" if overall else "degraded",
        "database": {"connected": db_ok, **db_stats},
        "redis": {"connected": redis_ok},
        "celery": {"connected": celery_ok, "workers": celery_workers},
        "engine": {"version": engine_version},
        "ingestion": ingestion_status,
    }


def _maybe_trigger_ingestion(db: Session) -> str:
    """Trigger data ingestion once, on first health check after deploy."""
    global _ingestion_triggered

    if _ingestion_triggered:
        return "already_triggered"

    with _ingestion_lock:
        if _ingestion_triggered:
            return "already_triggered"

        try:
            from app.db.base import create_tables
            create_tables()
        except Exception as e:
            logger.warning("create_tables in health check: %s", e)

        try:
            from app.services.startup_ingest import ensure_real_data
            ensure_real_data()
            _ingestion_triggered = True
            return "triggered"
        except Exception as e:
            logger.warning("Ingestion trigger failed: %s", e)
            return f"failed: {e}"


@router.get("/health")
async def health():
    """Simple health alias."""
    return {"status": "ok"}


@router.get("/info")
async def info():
    """API metadata."""
    from app.core.config import settings

    engine_version = "1.0.0"
    try:
        import materia
        engine_version = getattr(materia, "__version__", "1.0.0")
    except ImportError:
        pass

    from app.main import _BUILD_VERSION

    return {
        "name": settings.PROJECT_NAME,
        "version": _BUILD_VERSION,
        "engine_version": engine_version,
        "environment": settings.ENVIRONMENT,
    }
