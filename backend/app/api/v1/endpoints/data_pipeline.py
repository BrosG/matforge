"""Foundation model data pipeline endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.base import get_db
from app.db.models import User

router = APIRouter()


# --- Schemas ---


class AggregateStats(BaseModel):
    total_campaigns: int
    completed_campaigns: int
    total_materials: int
    total_pareto: int
    domain_counts: dict[str, int]
    property_keys: list[str]
    avg_materials_per_campaign: float


# --- Endpoints ---


@router.get("/stats", response_model=AggregateStats)
def get_aggregate_stats(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get aggregate statistics across all campaigns (admin only)."""
    from sqlalchemy import func

    from app.db.models import Campaign, MaterialRecord

    total_campaigns = db.query(func.count(Campaign.id)).scalar() or 0
    completed_campaigns = (
        db.query(func.count(Campaign.id))
        .filter(Campaign.status == "completed")
        .scalar()
        or 0
    )
    total_materials = db.query(func.count(MaterialRecord.id)).scalar() or 0
    total_pareto = (
        db.query(func.count(MaterialRecord.id))
        .filter(MaterialRecord.dominated == False)
        .scalar()
        or 0
    )

    domain_rows = (
        db.query(Campaign.domain, func.count(Campaign.id))
        .group_by(Campaign.domain)
        .all()
    )
    domain_counts = {row[0]: row[1] for row in domain_rows}

    # Collect all property keys from a sample of materials
    sample = db.query(MaterialRecord.properties).limit(100).all()
    property_keys = set()
    for (props,) in sample:
        if isinstance(props, dict):
            property_keys.update(props.keys())

    avg_materials = (
        total_materials / completed_campaigns if completed_campaigns > 0 else 0.0
    )

    return AggregateStats(
        total_campaigns=total_campaigns,
        completed_campaigns=completed_campaigns,
        total_materials=total_materials,
        total_pareto=total_pareto,
        domain_counts=domain_counts,
        property_keys=sorted(property_keys),
        avg_materials_per_campaign=round(avg_materials, 1),
    )


@router.get("/export")
def export_training_data(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Export anonymized cross-campaign training data as JSONL (admin only).

    Strips user info, normalizes properties, suitable for foundation model training.
    """
    import json

    from app.db.models import Campaign, MaterialRecord

    def generate_jsonl():
        campaigns = (
            db.query(Campaign).filter(Campaign.status == "completed").all()
        )
        for campaign in campaigns:
            materials = (
                db.query(MaterialRecord)
                .filter(MaterialRecord.campaign_id == campaign.id)
                .all()
            )
            for mat in materials:
                record = {
                    "domain": campaign.domain,
                    "params": mat.params if isinstance(mat.params, (list, dict)) else {},
                    "properties": mat.properties or {},
                    "composition": mat.composition or {},
                    "score": mat.score,
                    "source": mat.source,
                    "dominated": mat.dominated,
                    "round_number": mat.round_number,
                }
                yield json.dumps(record, default=str) + "\n"

    return StreamingResponse(
        generate_jsonl(),
        media_type="application/x-ndjson",
        headers={
            "Content-Disposition": "attachment; filename=matcraft_training_data.jsonl"
        },
    )
