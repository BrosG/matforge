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
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, JSONB
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
    credits = Column(Integer, nullable=False, default=10, server_default="10")  # 10 free starter credits
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    campaigns = relationship("Campaign", back_populates="owner")
    jobs = relationship("Job", back_populates="owner")
    credit_transactions = relationship("CreditTransaction", back_populates="user")


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


class IndexedMaterial(Base):
    __tablename__ = "indexed_materials"

    __table_args__ = (
        # Composite indexes for common query patterns
        Index('idx_mat_search_main', 'crystal_system', 'is_stable', 'band_gap'),
        Index('idx_mat_band_gap_stable', 'band_gap', 'is_stable'),
        Index('idx_mat_source_crystal', 'source_db', 'crystal_system'),
        # GIN trigram index for fast ILIKE on formula (requires pg_trgm extension)
        Index('idx_mat_formula_trgm', 'formula', postgresql_using='gin',
              postgresql_ops={'formula': 'gin_trgm_ops'}),
        # GIN index on elements JSON array for fast containment queries
        Index('idx_mat_elements_gin', 'elements', postgresql_using='gin'),
        # Individual indexes on filterable columns missing indexes
        Index('idx_mat_total_magnetization', 'total_magnetization'),
        Index('idx_mat_thermal_conductivity', 'thermal_conductivity'),
        Index('idx_mat_seebeck_coefficient', 'seebeck_coefficient'),
    )

    id = Column(String(36), primary_key=True, default=_uuid)
    external_id = Column(String(100), unique=True, nullable=False, index=True)
    source_db = Column(String(50), nullable=False, index=True)
    formula = Column(String(255), nullable=False, index=True)
    formula_anonymous = Column(String(255), nullable=True, index=True)
    elements = Column(JSON, nullable=False, default=list)
    n_elements = Column(Integer, nullable=False, default=0, index=True)
    composition = Column(JSON, default=dict)
    band_gap = Column(Float, nullable=True, index=True)
    formation_energy = Column(Float, nullable=True, index=True)
    energy_above_hull = Column(Float, nullable=True, index=True)
    density = Column(Float, nullable=True, index=True)
    total_magnetization = Column(Float, nullable=True)
    magnetic_ordering = Column(String(30), nullable=True)  # ferromagnetic, antiferromagnetic, ...
    volume = Column(Float, nullable=True)
    space_group = Column(String(20), nullable=True, index=True)
    crystal_system = Column(String(20), nullable=True, index=True)
    lattice_params = Column(JSON, nullable=True)
    structure_data = Column(JSON, nullable=True)

    # Mechanical properties
    bulk_modulus = Column(Float, nullable=True)       # GPa
    shear_modulus = Column(Float, nullable=True)      # GPa
    young_modulus = Column(Float, nullable=True)      # GPa
    poisson_ratio = Column(Float, nullable=True)      # dimensionless

    # Electronic properties
    dielectric_constant = Column(Float, nullable=True)
    refractive_index = Column(Float, nullable=True)

    # Thermal / thermoelectric
    thermal_conductivity = Column(Float, nullable=True)   # W/(m·K)
    seebeck_coefficient = Column(Float, nullable=True)    # uV/K

    # Carrier properties
    effective_mass_electron = Column(Float, nullable=True)  # m_e units
    effective_mass_hole = Column(Float, nullable=True)      # m_e units

    # Electronic extras
    efermi = Column(Float, nullable=True)             # eV
    is_gap_direct = Column(Boolean, nullable=True)

    # Decomposition
    decomposes_to = Column(JSON, nullable=True)       # list of competing phases

    # Provenance & reliability
    oxidation_states = Column(JSON, nullable=True)    # e.g. {"Fe": 3, "O": -2}
    calculation_method = Column(String(50), nullable=True)  # e.g. "GGA-PBE"
    is_theoretical = Column(Boolean, default=True)    # computed vs experimental
    experimentally_observed = Column(Boolean, default=False)  # has ICSD entry
    icsd_ids = Column(JSON, nullable=True)            # ICSD reference IDs
    database_ids = Column(JSON, nullable=True)        # cross-references to other DBs
    warnings = Column(JSON, default=list)             # e.g. ["disordered structure"]

    properties_json = Column(JSON, default=dict)
    source_url = Column(String(500), nullable=True)
    is_stable = Column(Boolean, default=False, index=True)
    tags = Column(JSON, default=list)
    fetched_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # positive = purchase, negative = usage
    balance_after = Column(Integer, nullable=False)
    description = Column(String(500))
    # Stripe event id for idempotent credit grants (unique per event).
    # Nullable because non-Stripe transactions (usage, admin grants) don't have one.
    stripe_event_id = Column(String(255), nullable=True, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    user = relationship("User", back_populates="credit_transactions")


class InvestorAccessRequest(Base):
    __tablename__ = "investor_access_requests"

    id = Column(String(36), primary_key=True, default=_uuid)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False, index=True)
    company = Column(String(200))
    role = Column(String(100))  # Investor / Analyst / Partner / Journalist / Other
    message = Column(Text)
    status = Column(String(20), nullable=False, default="pending", index=True)
    access_password = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String(36), nullable=True)
