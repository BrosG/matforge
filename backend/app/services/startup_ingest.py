"""Startup data ingestion: replace seeded data with real API data.

On first boot (or when the DB contains only seeded data), this module:
1. Deletes all seeded/synthetic IndexedMaterial records
2. Fetches real materials from Materials Project, AFLOW, and JARVIS
3. Ingests them with full property mapping and data quality normalization

Subsequent boots skip ingestion if real data already exists.
"""

from __future__ import annotations

import logging
import os

from app.db.base import get_db_context
from app.db.models import IndexedMaterial
from app.services.ingest_service import ingest_batch

logger = logging.getLogger(__name__)

# Sources that indicate seeded/fake data
_SEEDED_SOURCES = {"materials_project", "aflow", "oqmd"}

# How many materials to fetch from each source on startup
_DEFAULT_BATCH_SIZE = int(os.environ.get("INGEST_BATCH_SIZE", "100"))


_INGEST_VERSION = "v6"  # Bump this to force re-ingestion with latest code
_INGEST_MARKER_KEY = f"_matcraft_ingest_{_INGEST_VERSION}"


def _has_real_data(db) -> bool:
    """Check if the DB has data ingested with the CURRENT code version.

    Each ingestion version stamps records with a versioned marker.
    If no records have the current version marker, all data is stale
    and needs re-ingestion.
    """
    from sqlalchemy import cast, String

    real_count = (
        db.query(IndexedMaterial)
        .filter(IndexedMaterial.properties_json.isnot(None))
        .filter(
            cast(IndexedMaterial.properties_json, String).contains(_INGEST_MARKER_KEY)
        )
        .limit(1)
        .count()
    )
    return real_count > 0


def _delete_seeded_data(db) -> int:
    """Delete all existing indexed materials (they're synthetic)."""
    count = db.query(IndexedMaterial).count()
    if count > 0:
        db.query(IndexedMaterial).delete()
        db.commit()
        logger.info("Deleted %d seeded/synthetic materials", count)
    return count


def _ingest_from_materials_project(db, max_results: int) -> int:
    """Fetch and ingest from Materials Project API."""
    api_key = os.environ.get("MATERIALS_PROJECT_API_KEY", "")
    if not api_key:
        logger.warning("MATERIALS_PROJECT_API_KEY not set — skipping MP ingestion")
        return 0

    try:
        from materia.connectors.materials_project import MaterialsProjectConnector

        connector = MaterialsProjectConnector()
        entries = connector.search(max_results=max_results)
        batch = [
            {
                "external_id": e.external_id,
                "formula": e.formula,
                "properties": e.properties,
                "structure": e.structure if e.structure else None,
                "metadata": e.metadata,
            }
            for e in entries
        ]
        return ingest_batch(db, batch, "materials_project")
    except Exception as e:
        logger.error("Materials Project ingestion failed: %s", e)
        return 0


def _ingest_from_aflow(db, max_results: int) -> int:
    """Fetch and ingest from AFLOW."""
    try:
        from materia.connectors.aflow import AflowConnector

        connector = AflowConnector()
        entries = connector.search(max_results=max_results)
        batch = [
            {
                "external_id": e.external_id,
                "formula": e.formula,
                "properties": e.properties,
                "structure": e.structure if e.structure else None,
                "metadata": e.metadata,
            }
            for e in entries
        ]
        return ingest_batch(db, batch, "aflow")
    except Exception as e:
        logger.error("AFLOW ingestion failed: %s", e)
        return 0


def _ingest_from_jarvis(db, max_results: int) -> int:
    """Fetch and ingest from JARVIS-DFT."""
    try:
        from materia.connectors.jarvis import JarvisConnector

        connector = JarvisConnector()
        entries = connector.search(max_results=max_results)
        batch = [
            {
                "external_id": e.external_id,
                "formula": e.formula,
                "properties": e.properties,
                "structure": e.structure if e.structure else None,
                "metadata": e.metadata,
            }
            for e in entries
        ]
        return ingest_batch(db, batch, "jarvis")
    except Exception as e:
        logger.error("JARVIS ingestion failed: %s", e)
        return 0


def ensure_real_data() -> None:
    """Ensure the IndexedMaterial table has real API data, not synthetic seed data.

    Two-phase approach:
    1. Blocking: ingest ~100 materials per source for immediate availability
    2. Background: queue Celery task to paginate through ALL materials (~200k+)
    """
    with get_db_context() as db:
        if _has_real_data(db):
            total = db.query(IndexedMaterial).count()
            logger.info(
                "Real API data already present (%d materials) — skipping seed phase",
                total,
            )
            # Still queue full ingestion if we have less than 10k
            if total < 10000:
                _queue_full_ingestion()
            return

        logger.info("No real API data found — ingesting from public databases...")
        _delete_seeded_data(db)

        # Phase 1: blocking quick ingest for immediate data
        batch_size = _DEFAULT_BATCH_SIZE
        total = 0
        total += _ingest_from_materials_project(db, batch_size)
        total += _ingest_from_aflow(db, batch_size)
        total += _ingest_from_jarvis(db, batch_size)

        logger.info(
            "Phase 1 complete: %d real materials available immediately", total
        )

    # Phase 2: queue background job for full ingestion
    _queue_full_ingestion()


def _queue_full_ingestion() -> None:
    """Queue a Celery task to ingest ALL materials from public APIs."""
    try:
        from app.tasks.celery_app import celery_app

        celery_app.send_task(
            "app.tasks.ingest_materials.ingest_all",
            args=[["materials_project", "aflow", "jarvis"], 0],
            queue="default",
        )
        logger.info("Queued full background ingestion task")
    except Exception as e:
        logger.warning("Could not queue background ingestion: %s", e)
