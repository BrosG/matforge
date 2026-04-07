"""Celery task for running a materials discovery campaign."""

from __future__ import annotations

import json
import logging
import tempfile
from pathlib import Path

from app.tasks.celery_app import celery_app
from app.tasks.base import MatForgeTask

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, base=MatForgeTask, name="app.tasks.run_campaign.run_campaign_task")
def run_campaign_task(self, campaign_id: str) -> dict:
    """Execute a campaign using the materia core engine.

    1. Load campaign definition from DB
    2. Write YAML to temp file
    3. Run the Campaign engine
    4. Store materials back to DB
    5. Publish WebSocket updates per round
    """
    from app.db.base import get_db_context
    from app.db.models import Campaign
    from app.services import campaign_service

    # 1. Load campaign from DB
    with get_db_context() as db:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")

        yaml_content = campaign.definition_yaml
        config = campaign.config or {}

    # 2. Write YAML to temp file for the materia engine
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".yaml", delete=False, encoding="utf-8"
    ) as f:
        f.write(yaml_content)
        yaml_path = f.name

    try:
        # 3. Run the campaign via materia core engine
        from materia.campaign import Campaign as MateriaCampaign

        engine = MateriaCampaign.from_yaml(yaml_path)

        budget = config.get("budget", 500)
        rounds = config.get("rounds", 15)
        surrogate_evals = config.get("surrogate_evals", 5_000_000)
        seed = config.get("seed")

        # Patch the round callback to publish progress
        original_callback = engine._on_round_complete

        def progress_callback(round_result):
            original_callback(round_result)

            # Update DB progress
            with get_db_context() as db:
                campaign_service.update_campaign_progress(
                    db=db,
                    campaign_id=campaign_id,
                    current_round=round_result.round_number,
                    total_rounds=rounds,
                    total_evaluated=round_result.total_evaluated,
                    pareto_size=len(round_result.pareto_front),
                )

            # Publish WebSocket update
            _publish_ws_update(campaign_id, {
                "type": "ROUND_COMPLETE",
                "round": round_result.round_number,
                "total_rounds": rounds,
                "total_evaluated": round_result.total_evaluated,
                "pareto_size": len(round_result.pareto_front),
                "best_score": round_result.best_score,
                "progress": int((round_result.round_number / max(rounds, 1)) * 100),
            })

            # Update Celery task progress
            self.update_progress(round_result.round_number, rounds, {
                "pareto_size": len(round_result.pareto_front),
                "total_evaluated": round_result.total_evaluated,
            })

        engine._on_round_complete = progress_callback

        result = engine.run(
            budget=budget,
            rounds=rounds,
            surrogate_evals=surrogate_evals,
            seed=seed,
        )

        # 4. Store materials in DB
        with get_db_context() as db:
            # Convert Material objects to dicts
            material_dicts = []
            pareto_ids = {id(m) for m in result.pareto_front}
            for m in result.all_materials:
                material_dicts.append({
                    "params": m.params.tolist(),
                    "properties": m.properties,
                    "composition": m.composition,
                    "score": m.score,
                    "source": m.source.value,
                    "uncertainty": m.uncertainty,
                    "dominated": id(m) not in pareto_ids,
                    "metadata": {},
                })

            campaign_service.save_materials(
                db=db,
                campaign_id=campaign_id,
                materials=material_dicts,
            )

            # 5. Mark campaign completed
            summary = {
                "total_rounds": result.total_rounds,
                "total_evaluated": result.total_evaluated,
                "pareto_size": len(result.pareto_front),
                "wall_time_seconds": result.wall_time_seconds,
            }
            campaign_service.mark_campaign_completed(
                db=db,
                campaign_id=campaign_id,
                result_summary=summary,
                wall_time=result.wall_time_seconds,
            )

        # Publish completion
        _publish_ws_update(campaign_id, {
            "type": "CAMPAIGN_COMPLETE",
            "total_rounds": result.total_rounds,
            "total_evaluated": result.total_evaluated,
            "pareto_size": len(result.pareto_front),
            "wall_time": result.wall_time_seconds,
        })

        return summary

    except Exception as exc:
        logger.error(f"Campaign {campaign_id} failed: {exc}", exc_info=True)
        with get_db_context() as db:
            campaign_service.mark_campaign_failed(db, campaign_id, str(exc))
        _publish_ws_update(campaign_id, {
            "type": "CAMPAIGN_FAILED",
            "error": str(exc),
        })
        raise

    finally:
        Path(yaml_path).unlink(missing_ok=True)


def _publish_ws_update(campaign_id: str, data: dict) -> None:
    """Publish a message to the WebSocket Redis channel."""
    try:
        from app.core.redis_connector import get_ws_redis

        r = get_ws_redis()
        channel = f"ws:campaign:{campaign_id}"
        r.publish(channel, json.dumps(data))
    except Exception as e:
        logger.warning(f"Failed to publish WS update: {e}")
