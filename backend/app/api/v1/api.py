"""API v1 router aggregation."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import builder, campaigns, data_pipeline, datasets, electronic_structure, health, jobs, materials, templates, users, websockets

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(data_pipeline.router, prefix="/data-pipeline", tags=["data-pipeline"])
api_router.include_router(websockets.router, prefix="/ws", tags=["websocket"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(electronic_structure.router, prefix="/electronic", tags=["electronic-structure"])
api_router.include_router(builder.router, prefix="/builder", tags=["structure-builder"])
api_router.include_router(health.router, tags=["health"])
