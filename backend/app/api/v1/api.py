"""API v1 router aggregation."""

from __future__ import annotations

from app.api.v1.endpoints import (
    admin,
    builder,
    campaigns,
    credits,
    data_pipeline,
    datasets,
    deep_scan,
    electronic_structure,
    health,
    investor_access,
    ip_radar,
    jobs,
    materials,
    nl_search,
    places,
    stripe_payments,
    templates,
    users,
    websockets,
)
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(
    data_pipeline.router, prefix="/data-pipeline", tags=["data-pipeline"]
)
api_router.include_router(websockets.router, prefix="/ws", tags=["websocket"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(
    electronic_structure.router, prefix="/electronic", tags=["electronic-structure"]
)
api_router.include_router(builder.router, prefix="/builder", tags=["structure-builder"])
api_router.include_router(nl_search.router, tags=["natural-language"])
api_router.include_router(ip_radar.router, prefix="/ip-radar", tags=["ip-radar"])
api_router.include_router(deep_scan.router, prefix="/deep-scan", tags=["deep-scan"])
api_router.include_router(credits.router, prefix="/credits", tags=["credits"])
api_router.include_router(stripe_payments.router, prefix="/stripe", tags=["stripe"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(
    investor_access.router, prefix="/investor-access", tags=["investor-access"]
)
api_router.include_router(places.router, prefix="/places", tags=["places"])
api_router.include_router(health.router, tags=["health"])
