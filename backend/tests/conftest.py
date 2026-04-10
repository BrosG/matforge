"""Shared test fixtures for backend tests.

Uses SQLite in-memory for fast, isolated database tests.
Patches Redis-dependent paths so tests run without infrastructure.
"""

from __future__ import annotations

import os
from typing import Generator
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Force test settings before any app import
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ENABLE_API_AUTHENTICATION", "true")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("CELERY_BROKER_URL", "redis://localhost:6379/15")
os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://localhost:6379/15")
os.environ.setdefault("WEBSOCKET_REDIS_URL", "redis://localhost:6379/15")

from app.core.config import Settings, get_settings  # noqa: E402
from app.core.security import create_access_token, hash_password  # noqa: E402
from app.db.base import Base, get_db  # noqa: E402
from app.db.models import User  # noqa: E402


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    """Ensure settings cache is cleared between tests."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture()
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db_session(db_engine) -> Generator[Session, None, None]:
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    """TestClient wired to the in-memory SQLite session."""
    from app.main import app

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def test_user(db_session: Session) -> User:
    """Create and persist a test user."""
    user = User(
        email="test@matcraft.dev",
        hashed_password=hash_password("testpassword123"),
        full_name="Test User",
        is_admin=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def admin_user(db_session: Session) -> User:
    """Create and persist an admin user."""
    user = User(
        email="admin@matcraft.dev",
        hashed_password=hash_password("adminpassword123"),
        full_name="Admin User",
        is_admin=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_headers(test_user: User) -> dict[str, str]:
    """Authorization headers for the test user."""
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_auth_headers(admin_user: User) -> dict[str, str]:
    """Authorization headers for the admin user."""
    token = create_access_token(admin_user.id)
    return {"Authorization": f"Bearer {token}"}


SAMPLE_YAML = """\
name: test_material
domain: test
parameters:
  - name: x
    range: [0, 10]
  - name: y
    range: [0, 10]
objectives:
  - name: f1
    direction: minimize
  - name: f2
    direction: maximize
"""
