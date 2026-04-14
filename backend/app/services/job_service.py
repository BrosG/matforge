"""Job service for tracking background tasks."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from app.db.models import Job
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def create_job(
    db: Session,
    name: str,
    job_type: str,
    owner_id: str,
    campaign_id: Optional[str] = None,
    parameters: Optional[dict] = None,
) -> Job:
    job = Job(
        name=name,
        type=job_type,
        owner_id=owner_id,
        campaign_id=campaign_id,
        parameters=parameters or {},
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job_status(
    db: Session,
    job_id: str,
    status: str,
    progress: int = 0,
    result: Optional[dict] = None,
    error_message: Optional[str] = None,
) -> None:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return
    job.status = status
    job.progress = progress
    if status == "running" and not job.started_at:
        job.started_at = datetime.now(timezone.utc)
    if status in ("completed", "failed"):
        job.completed_at = datetime.now(timezone.utc)
    if result:
        job.result = result
    if error_message:
        job.error_message = error_message
    db.commit()
