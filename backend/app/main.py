"""MatCraft FastAPI application."""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.api.middleware import (
    RateLimitingMiddleware,
    RequestIDMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.base import create_tables

# ---------------------------------------------------------------------------
# Structured logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s level=%(levelname)s logger=%(name)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def _validate_config() -> None:
    """Fail fast on dangerous default config in non-dev environments."""
    if settings.ENVIRONMENT != "development":
        if settings.SECRET_KEY == "change-me-in-production":
            raise RuntimeError(
                "SECRET_KEY must be changed from its default value in "
                f"{settings.ENVIRONMENT} environment"
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    _validate_config()
    logger.info(
        "Starting %s environment=%s", settings.PROJECT_NAME, settings.ENVIRONMENT
    )

    # Ensure all tables and columns exist
    create_tables()
    logger.info("Database tables created/verified")

    # Normalize all existing material data (lattice, magnetization, tags, warnings)
    try:
        from app.services.data_quality import normalize_all_materials
        from app.db.base import get_db_context

        with get_db_context() as db:
            count = normalize_all_materials(db)
            if count > 0:
                logger.info("Normalized %d indexed materials on startup", count)
    except Exception as e:
        logger.warning("Material normalization skipped: %s", e)

    yield

    # Shutdown
    from app.core.redis_connector import close_redis
    close_redis()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="Materials Discovery Platform - Surrogate Models + Active Learning + Pareto Optimization",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Global exception handler - never leak stack traces to clients
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "-")
    logger.exception("request_id=%s unhandled_exception", request_id)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": request_id,
        },
    )


# ---------------------------------------------------------------------------
# Middleware stack (order matters - last added = first executed)
# ---------------------------------------------------------------------------
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitingMiddleware, requests_per_minute=120)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.BACKEND_CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "0.1.0",
        "docs": f"{settings.API_V1_PREFIX}/docs",
    }
