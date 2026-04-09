"""Base Celery task with DB integration and progress tracking."""

from __future__ import annotations

import logging

from celery import Task

from app.db.base import get_db_context

logger = logging.getLogger(__name__)


class MatCraftTask(Task):
    """Base task class that updates Job records on success/failure."""

    abstract = True

    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f"Task {task_id} completed successfully")

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")

    def update_progress(self, current: int, total: int, meta: dict | None = None):
        """Update task progress metadata."""
        progress = int((current / max(total, 1)) * 100)
        self.update_state(
            state="PROGRESS",
            meta={"current": current, "total": total, "progress": progress, **(meta or {})},
        )
