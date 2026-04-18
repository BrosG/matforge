"""Add cached_places table for Google Places lookups with offline fallback.

Revision ID: 004_cached_places
Revises: 003_stripe_event_id
Create Date: 2026-04-15
"""

import sqlalchemy as sa
from alembic import op

revision = "004_cached_places"
down_revision = "003_stripe_event_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "cached_places" in inspector.get_table_names():
        return

    op.create_table(
        "cached_places",
        sa.Column("place_id", sa.String(255), primary_key=True),
        sa.Column("display_name", sa.String(500), nullable=False),
        sa.Column("formatted_address", sa.String(1000), nullable=False),
        sa.Column("normalized", sa.Text, nullable=False),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("raw_json", sa.JSON, nullable=True),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "last_used_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("use_count", sa.Integer, server_default="1", nullable=False),
    )
    op.create_index(
        "ix_cached_places_normalized", "cached_places", ["normalized"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_cached_places_normalized", table_name="cached_places")
    op.drop_table("cached_places")
