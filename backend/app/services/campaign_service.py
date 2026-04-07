"""Campaign service for orchestrating materials discovery campaigns."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models import Campaign, MaterialRecord

logger = logging.getLogger(__name__)


def get_campaign(db: Session, campaign_id: str, owner_id: Optional[str] = None) -> Optional[Campaign]:
    query = db.query(Campaign).filter(Campaign.id == campaign_id)
    if owner_id:
        query = query.filter(Campaign.owner_id == owner_id)
    return query.first()


def update_campaign_progress(
    db: Session,
    campaign_id: str,
    current_round: int,
    total_rounds: int,
    total_evaluated: int,
    pareto_size: int,
) -> None:
    """Update campaign progress during active learning."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return
    campaign.current_round = current_round
    campaign.total_rounds = total_rounds
    campaign.total_evaluated = total_evaluated
    campaign.pareto_size = pareto_size
    campaign.progress = int((current_round / max(total_rounds, 1)) * 100)
    db.commit()


def mark_campaign_completed(
    db: Session,
    campaign_id: str,
    result_summary: dict,
    wall_time: float,
) -> None:
    """Mark a campaign as completed with summary results."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return
    campaign.status = "completed"
    campaign.completed_at = datetime.now(timezone.utc)
    campaign.result_summary = result_summary
    campaign.wall_time_seconds = wall_time
    campaign.progress = 100
    db.commit()


def mark_campaign_failed(db: Session, campaign_id: str, error: str) -> None:
    """Mark a campaign as failed."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return
    campaign.status = "failed"
    campaign.completed_at = datetime.now(timezone.utc)
    campaign.result_summary = {"error": error}
    db.commit()


def save_materials(
    db: Session,
    campaign_id: str,
    materials: list[dict],
    round_number: int = 0,
) -> None:
    """Bulk save material records for a campaign."""
    records = []
    for m in materials:
        record = MaterialRecord(
            campaign_id=campaign_id,
            params=m.get("params", []),
            properties=m.get("properties", {}),
            composition=m.get("composition", {}),
            score=m.get("score", 0.0),
            source=m.get("source", "initial"),
            uncertainty=m.get("uncertainty", {}),
            dominated=m.get("dominated", False),
            round_number=round_number,
            metadata_=m.get("metadata", {}),
        )
        records.append(record)
    db.bulk_save_objects(records)
    db.commit()
