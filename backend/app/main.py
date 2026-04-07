"""MatForge FastAPI application."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.middleware import RateLimitingMiddleware, SecurityHeadersMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.base import create_tables

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info(f"Starting {settings.PROJECT_NAME} ({settings.ENVIRONMENT})")

    # Create tables in development mode
    if settings.ENVIRONMENT == "development":
        create_tables()
        logger.info("Database tables created/verified")

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

# Middleware (order matters - last added = first executed)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitingMiddleware, requests_per_minute=120)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
