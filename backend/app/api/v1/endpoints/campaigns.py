"""Campaign CRUD and execution endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_current_user_optional
from app.db.base import get_db
from app.db.models import Campaign, MaterialRecord, User

router = APIRouter()


# --- Request / Response schemas ---


class CampaignCreateRequest(BaseModel):
    name: str
    description: str | None = None
    domain: str
    definition_yaml: str
    config: dict = {}


class CampaignRunRequest(BaseModel):
    budget: int = 500
    rounds: int = 15
    surrogate_evals: int = 5_000_000
    seed: int | None = None


class CampaignResponse(BaseModel):
    id: str
    name: str
    description: str | None
    domain: str
    status: str
    config: dict
    progress: int
    current_round: int
    total_rounds: int
    total_evaluated: int
    pareto_size: int
    wall_time_seconds: float | None
    owner_id: str
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class CampaignListResponse(BaseModel):
    campaigns: list[CampaignResponse]
    total: int
    page: int
    limit: int


class MaterialResponse(BaseModel):
    id: str
    params: list
    properties: dict
    composition: dict
    score: float
    source: str
    uncertainty: dict
    dominated: bool
    round_number: int

    model_config = {"from_attributes": True}


class CampaignResultResponse(BaseModel):
    campaign: CampaignResponse
    pareto_front: list[MaterialResponse]
    all_materials: list[MaterialResponse]


class AnalyticsResponse(BaseModel):
    total_campaigns: int
    completed_campaigns: int
    running_campaigns: int
    failed_campaigns: int
    total_evaluated: int
    total_pareto: int
    avg_wall_time: float | None
    domain_counts: dict[str, int]
    recent_campaigns: list[CampaignResponse]


# --- Endpoints ---


@router.get("/public", response_model=CampaignListResponse)
def list_public_campaigns(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    domain: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List completed campaigns publicly (no auth required)."""
    query = db.query(Campaign).filter(Campaign.status == "completed")
    if domain:
        query = query.filter(Campaign.domain == domain)
    if search:
        query = query.filter(
            Campaign.name.ilike(f"%{search}%")
            | Campaign.description.ilike(f"%{search}%")
        )

    total = query.count()
    campaigns = (
        query.order_by(Campaign.completed_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return CampaignListResponse(
        campaigns=campaigns, total=total, page=page, limit=limit
    )


@router.get("/public/{campaign_id}")
def get_public_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
):
    """Get a completed campaign's full details publicly (no auth required)."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.status == "completed")
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    pareto = (
        db.query(MaterialRecord)
        .filter(
            MaterialRecord.campaign_id == campaign_id,
            MaterialRecord.dominated == False,
        )
        .order_by(MaterialRecord.score.desc())
        .all()
    )
    all_materials = (
        db.query(MaterialRecord)
        .filter(MaterialRecord.campaign_id == campaign_id)
        .order_by(MaterialRecord.round_number, MaterialRecord.score.desc())
        .all()
    )

    return CampaignResultResponse(
        campaign=campaign,
        pareto_front=pareto,
        all_materials=all_materials,
    )


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get aggregated analytics for the current user's campaigns."""
    from sqlalchemy import func

    base = db.query(Campaign).filter(Campaign.owner_id == current_user.id)
    total = base.count()
    completed = base.filter(Campaign.status == "completed").count()
    running = base.filter(Campaign.status == "running").count()
    failed = base.filter(Campaign.status == "failed").count()

    agg = (
        db.query(
            func.coalesce(func.sum(Campaign.total_evaluated), 0),
            func.coalesce(func.sum(Campaign.pareto_size), 0),
            func.avg(Campaign.wall_time_seconds),
        )
        .filter(Campaign.owner_id == current_user.id)
        .first()
    )
    total_evaluated = int(agg[0]) if agg else 0
    total_pareto = int(agg[1]) if agg else 0
    avg_wall_time = float(agg[2]) if agg and agg[2] else None

    domain_rows = (
        db.query(Campaign.domain, func.count(Campaign.id))
        .filter(Campaign.owner_id == current_user.id)
        .group_by(Campaign.domain)
        .all()
    )
    domain_counts = {row[0]: row[1] for row in domain_rows}

    recent = (
        base.order_by(Campaign.created_at.desc())
        .limit(5)
        .all()
    )

    return AnalyticsResponse(
        total_campaigns=total,
        completed_campaigns=completed,
        running_campaigns=running,
        failed_campaigns=failed,
        total_evaluated=total_evaluated,
        total_pareto=total_pareto,
        avg_wall_time=avg_wall_time,
        domain_counts=domain_counts,
        recent_campaigns=recent,
    )


@router.post("", response_model=CampaignResponse, status_code=201)
def create_campaign(
    body: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new campaign."""
    campaign = Campaign(
        name=body.name,
        description=body.description,
        domain=body.domain,
        definition_yaml=body.definition_yaml,
        config=body.config,
        owner_id=current_user.id,
        status="pending",
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("", response_model=CampaignListResponse)
def list_campaigns(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    domain: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List campaigns for the current user."""
    query = db.query(Campaign).filter(Campaign.owner_id == current_user.id)
    if domain:
        query = query.filter(Campaign.domain == domain)
    if status_filter:
        query = query.filter(Campaign.status == status_filter)

    total = query.count()
    campaigns = (
        query.order_by(Campaign.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return CampaignListResponse(
        campaigns=campaigns, total=total, page=page, limit=limit
    )


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single campaign by ID."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.post("/{campaign_id}/run", response_model=CampaignResponse)
def run_campaign(
    campaign_id: str,
    body: CampaignRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Launch a campaign execution as a background Celery task."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status == "running":
        raise HTTPException(status_code=409, detail="Campaign is already running")

    campaign.status = "running"
    campaign.started_at = datetime.now(timezone.utc)
    campaign.config = {
        "budget": body.budget,
        "rounds": body.rounds,
        "surrogate_evals": body.surrogate_evals,
        "seed": body.seed,
    }
    db.commit()
    db.refresh(campaign)

    # Dispatch Celery task
    from app.tasks.celery_app import celery_app

    task = celery_app.send_task(
        "app.tasks.run_campaign.run_campaign_task",
        args=[campaign.id],
        queue="campaigns",
    )
    campaign.celery_task_id = task.id
    db.commit()
    db.refresh(campaign)

    return campaign


@router.get("/{campaign_id}/results", response_model=CampaignResultResponse)
def get_campaign_results(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full results including materials for a campaign."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    pareto = (
        db.query(MaterialRecord)
        .filter(
            MaterialRecord.campaign_id == campaign_id,
            MaterialRecord.dominated == False,
        )
        .all()
    )
    all_materials = (
        db.query(MaterialRecord)
        .filter(MaterialRecord.campaign_id == campaign_id)
        .order_by(MaterialRecord.round_number, MaterialRecord.score.desc())
        .all()
    )
    return CampaignResultResponse(
        campaign=campaign,
        pareto_front=pareto,
        all_materials=all_materials,
    )


@router.delete("/{campaign_id}", status_code=204)
def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a campaign and its materials."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status == "running":
        raise HTTPException(status_code=409, detail="Cannot delete a running campaign")
    db.delete(campaign)
    db.commit()


@router.get("/{campaign_id}/export")
def export_campaign(
    campaign_id: str,
    format: str = Query("csv", pattern="^(csv|json|recipe|cif|poscar)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export campaign results as CSV or JSON."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    materials = (
        db.query(MaterialRecord)
        .filter(MaterialRecord.campaign_id == campaign_id)
        .all()
    )

    if format == "cif":
        from starlette.responses import Response

        from materia.io.cif_writer import material_to_cif

        cif_blocks = []
        for m in materials:
            composition = m.composition or {}
            cif_blocks.append(material_to_cif(composition, m.properties or {}))
        content = "\n\n".join(cif_blocks)
        return Response(
            content=content,
            media_type="chemical/x-cif",
            headers={"Content-Disposition": f"attachment; filename={campaign.name}_materials.cif"},
        )

    if format == "poscar":
        from starlette.responses import Response

        from materia.io.poscar_writer import material_to_poscar

        poscar_blocks = []
        for m in materials:
            composition = m.composition or {}
            poscar_blocks.append(material_to_poscar(composition, m.properties or {}))
        content = "\n".join(poscar_blocks)
        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={campaign.name}_materials.poscar"},
        )

    if format == "json":
        from fastapi.responses import JSONResponse

        data = [
            {
                "params": m.params,
                "properties": m.properties,
                "score": m.score,
                "source": m.source,
                "dominated": m.dominated,
                "round": m.round_number,
            }
            for m in materials
        ]
        return JSONResponse(content=data)

    # CSV
    import csv
    import io

    from starlette.responses import StreamingResponse

    output = io.StringIO()
    if materials:
        prop_keys = sorted(materials[0].properties.keys()) if materials[0].properties else []
        writer = csv.writer(output)
        writer.writerow(["score", "source", "dominated", "round"] + prop_keys)
        for m in materials:
            row = [m.score, m.source, m.dominated, m.round_number]
            row += [m.properties.get(k, "") for k in prop_keys]
            writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={campaign.name}_results.csv"},
    )
