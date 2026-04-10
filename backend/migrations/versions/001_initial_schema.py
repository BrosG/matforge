"""Initial schema - all tables.

Revision ID: 001_initial
Revises:
Create Date: 2026-04-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=True),
        sa.Column("phone_number", sa.String(20), unique=True, nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("oauth_provider", sa.String(50), nullable=True),
        sa.Column("oauth_id", sa.String(255), nullable=True),
        sa.Column("is_admin", sa.Boolean, default=False, nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_phone_number", "users", ["phone_number"])

    # --- campaigns ---
    op.create_table(
        "campaigns",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("domain", sa.String(100), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "running", "completed", "failed", name="campaign_status"),
            default="pending",
            nullable=False,
        ),
        sa.Column("definition_yaml", sa.Text, nullable=False),
        sa.Column("config", JSON, default=dict),
        sa.Column("result_summary", JSON, nullable=True),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("progress", sa.Integer, default=0),
        sa.Column("total_rounds", sa.Integer, default=0),
        sa.Column("current_round", sa.Integer, default=0),
        sa.Column("total_evaluated", sa.Integer, default=0),
        sa.Column("pareto_size", sa.Integer, default=0),
        sa.Column("wall_time_seconds", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_campaigns_domain", "campaigns", ["domain"])
    op.create_index("ix_campaigns_status", "campaigns", ["status"])
    op.create_index("ix_campaigns_owner_id", "campaigns", ["owner_id"])

    # --- material_records ---
    op.create_table(
        "material_records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "campaign_id",
            sa.String(36),
            sa.ForeignKey("campaigns.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("params", JSON, nullable=False),
        sa.Column("properties", JSON, default=dict),
        sa.Column("composition", JSON, default=dict),
        sa.Column("score", sa.Float, default=0.0),
        sa.Column("source", sa.String(50), default="initial"),
        sa.Column("uncertainty", JSON, default=dict),
        sa.Column("dominated", sa.Boolean, default=False),
        sa.Column("round_number", sa.Integer, default=0),
        sa.Column("metadata", JSON, default=dict),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_material_records_campaign_id", "material_records", ["campaign_id"])

    # --- jobs ---
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "queued", "running", "completed", "failed", name="job_status"),
            default="pending",
            nullable=False,
        ),
        sa.Column(
            "campaign_id",
            sa.String(36),
            sa.ForeignKey("campaigns.id"),
            nullable=True,
        ),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("parameters", JSON, default=dict),
        sa.Column("result", JSON, nullable=True),
        sa.Column("progress", sa.Integer, default=0),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_jobs_type", "jobs", ["type"])
    op.create_index("ix_jobs_status", "jobs", ["status"])
    op.create_index("ix_jobs_campaign_id", "jobs", ["campaign_id"])
    op.create_index("ix_jobs_owner_id", "jobs", ["owner_id"])

    # --- templates ---
    op.create_table(
        "templates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("domain", sa.String(100), nullable=False),
        sa.Column("definition_yaml", sa.Text, nullable=False),
        sa.Column("author_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("likes_count", sa.Integer, default=0),
        sa.Column("forks_count", sa.Integer, default=0),
        sa.Column("is_official", sa.Boolean, default=False),
        sa.Column("tags", JSON, default=list),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_templates_domain", "templates", ["domain"])
    op.create_index("ix_templates_author_id", "templates", ["author_id"])

    # --- template_likes ---
    op.create_table(
        "template_likes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "template_id",
            sa.String(36),
            sa.ForeignKey("templates.id"),
            nullable=False,
        ),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
    )
    op.create_index("ix_template_likes_template_id", "template_likes", ["template_id"])
    op.create_index("ix_template_likes_user_id", "template_likes", ["user_id"])
    op.create_unique_constraint(
        "uq_template_likes_template_user",
        "template_likes",
        ["template_id", "user_id"],
    )

    # --- indexed_materials ---
    op.create_table(
        "indexed_materials",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("external_id", sa.String(100), unique=True, nullable=False),
        sa.Column("source_db", sa.String(50), nullable=False),
        sa.Column("formula", sa.String(255), nullable=False),
        sa.Column("formula_anonymous", sa.String(255), nullable=True),
        sa.Column("elements", JSON, nullable=False, default=list),
        sa.Column("n_elements", sa.Integer, nullable=False, default=0),
        sa.Column("composition", JSON, default=dict),
        sa.Column("band_gap", sa.Float, nullable=True),
        sa.Column("formation_energy", sa.Float, nullable=True),
        sa.Column("energy_above_hull", sa.Float, nullable=True),
        sa.Column("density", sa.Float, nullable=True),
        sa.Column("total_magnetization", sa.Float, nullable=True),
        sa.Column("volume", sa.Float, nullable=True),
        sa.Column("space_group", sa.String(20), nullable=True),
        sa.Column("crystal_system", sa.String(20), nullable=True),
        sa.Column("lattice_params", JSON, nullable=True),
        sa.Column("structure_data", JSON, nullable=True),
        sa.Column("properties_json", JSON, default=dict),
        sa.Column("source_url", sa.String(500), nullable=True),
        sa.Column("is_stable", sa.Boolean, default=False),
        sa.Column("tags", JSON, default=list),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_indexed_materials_external_id", "indexed_materials", ["external_id"])
    op.create_index("ix_indexed_materials_source_db", "indexed_materials", ["source_db"])
    op.create_index("ix_indexed_materials_formula", "indexed_materials", ["formula"])
    op.create_index("ix_indexed_materials_formula_anonymous", "indexed_materials", ["formula_anonymous"])
    op.create_index("ix_indexed_materials_n_elements", "indexed_materials", ["n_elements"])
    op.create_index("ix_indexed_materials_band_gap", "indexed_materials", ["band_gap"])
    op.create_index("ix_indexed_materials_formation_energy", "indexed_materials", ["formation_energy"])
    op.create_index("ix_indexed_materials_energy_above_hull", "indexed_materials", ["energy_above_hull"])
    op.create_index("ix_indexed_materials_density", "indexed_materials", ["density"])
    op.create_index("ix_indexed_materials_space_group", "indexed_materials", ["space_group"])
    op.create_index("ix_indexed_materials_crystal_system", "indexed_materials", ["crystal_system"])
    op.create_index("ix_indexed_materials_is_stable", "indexed_materials", ["is_stable"])


def downgrade() -> None:
    op.drop_table("indexed_materials")
    op.drop_table("template_likes")
    op.drop_table("templates")
    op.drop_table("jobs")
    op.drop_table("material_records")
    op.drop_table("campaigns")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS campaign_status")
    op.execute("DROP TYPE IF EXISTS job_status")
