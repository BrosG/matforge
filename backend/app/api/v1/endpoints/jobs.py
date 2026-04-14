"""Job tracking endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.core.security import get_current_user
from app.db.base import get_db
from app.db.models import Job, User
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()


class JobCreateRequest(BaseModel):
    name: str
    type: str
    campaign_id: str | None = None
    parameters: dict = {}


class JobResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    campaign_id: str | None
    owner_id: str
    progress: int
    error_message: str | None
    result: dict | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    limit: int


@router.post("", response_model=JobResponse, status_code=201)
def create_job(
    body: JobCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new job."""
    job = Job(
        name=body.name,
        type=body.type,
        campaign_id=body.campaign_id,
        owner_id=current_user.id,
        parameters=body.parameters,
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=JobListResponse)
def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List jobs for the current user."""
    query = db.query(Job).filter(Job.owner_id == current_user.id)
    if status_filter:
        query = query.filter(Job.status == status_filter)

    total = query.count()
    jobs = (
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return JobListResponse(jobs=jobs, total=total, page=page, limit=limit)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single job by ID."""
    job = (
        db.query(Job).filter(Job.id == job_id, Job.owner_id == current_user.id).first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
