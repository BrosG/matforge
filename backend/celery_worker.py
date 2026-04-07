"""Celery worker entry point."""

import sys
from pathlib import Path

# Ensure the backend directory is on the path
sys.path.insert(0, str(Path(__file__).parent))

from app.tasks.celery_app import celery_app  # noqa: E402

if __name__ == "__main__":
    celery_app.start()
