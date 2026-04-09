"""SQLAlchemy ORM models for MatCraft."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone_number = Column(String(20), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    oauth_provider = Column(String(50), nullable=True)
    oauth_id = Column(String(255), nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    campaigns = relationship("Campaign", back_populates="owner")
    jobs = relationship("Job", back_populates="owner")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String(100), nullable=False, index=True)
    status = Column(
        Enum("pending", "running", "completed", "failed", name="campaign_status"),
        default="pending",
        nullable=False,
        index=True,
    )
    definition_yaml = Column(Text, nullable=False)
    config = Column(JSON, default=dict)
    result_summary = Column(JSON, nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    celery_task_id = Column(String(255), nullable=True)
    progress = Column(Integer, default=0)
    total_rounds = Column(Integer, default=0)
    current_round = Column(Integer, default=0)
    total_evaluated = Column(Integer, default=0)
    pareto_size = Column(Integer, default=0)
    wall_time_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    owner = relationship("User", back_populates="campaigns")
    materials = relationship(
        "MaterialRecord", back_populates="campaign", cascade="all, delete-orphan"
    )
    jobs = relationship("Job", back_populates="campaign")


class MaterialRecord(Base):
    __tablename__ = "material_records"

    id = Column(String(36), primary_key=True, default=_uuid)
    campaign_id = Column(
        String(36), ForeignKey("campaigns.id"), nullable=False, index=True
    )
    params = Column(JSON, nullable=False)
    properties = Column(JSON, default=dict)
    composition = Column(JSON, default=dict)
    score = Column(Float, default=0.0)
    source = Column(String(50), default="initial")
    uncertainty = Column(JSON, default=dict)
    dominated = Column(Boolean, default=False)
    round_number = Column(Integer, default=0)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    campaign = relationship("Campaign", back_populates="materials")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False, index=True)
    status = Column(
        Enum("pending", "queued", "running", "completed", "failed", name="job_status"),
        default="pending",
        nullable=False,
        index=True,
    )
    campaign_id = Column(
        String(36), ForeignKey("campaigns.id"), nullable=True, index=True
    )
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    celery_task_id = Column(String(255), nullable=True)
    parameters = Column(JSON, default=dict)
    result = Column(JSON, nullable=True)
    progress = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    campaign = relationship("Campaign", back_populates="jobs")
    owner = relationship("User", back_populates="jobs")


class Template(Base):
    __tablename__ = "templates"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String(100), nullable=False, index=True)
    definition_yaml = Column(Text, nullable=False)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    likes_count = Column(Integer, default=0)
    forks_count = Column(Integer, default=0)
    is_official = Column(Boolean, default=False)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    author = relationship("User")


class TemplateLike(Base):
    __tablename__ = "template_likes"

    id = Column(String(36), primary_key=True, default=_uuid)
    template_id = Column(String(36), ForeignKey("templates.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
