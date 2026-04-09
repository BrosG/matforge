"""Celery application configuration."""

from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "matcraft",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.run_campaign"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_queues={
        "default": {"exchange": "default", "routing_key": "default"},
        "campaigns": {"exchange": "campaigns", "routing_key": "campaigns"},
    },
    task_routes={
        "app.tasks.run_campaign.*": {"queue": "campaigns"},
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])
