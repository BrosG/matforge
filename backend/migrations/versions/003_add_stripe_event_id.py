"""Add stripe_event_id to credit_transactions for idempotent webhook grants.

Revision ID: 003_stripe_event_id
Revises: 002_add_props
Create Date: 2026-04-14
"""

from alembic import op
import sqlalchemy as sa

revision = "003_stripe_event_id"
down_revision = "002_add_props"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = {c["name"] for c in inspector.get_columns("credit_transactions")}
    if "stripe_event_id" not in cols:
        op.add_column(
            "credit_transactions",
            sa.Column("stripe_event_id", sa.String(255), nullable=True),
        )

    existing_indexes = {ix["name"] for ix in inspector.get_indexes("credit_transactions")}
    if "ix_credit_transactions_stripe_event_id" not in existing_indexes:
        op.create_index(
            "ix_credit_transactions_stripe_event_id",
            "credit_transactions",
            ["stripe_event_id"],
            unique=True,
        )


def downgrade() -> None:
    op.drop_index(
        "ix_credit_transactions_stripe_event_id", table_name="credit_transactions"
    )
    op.drop_column("credit_transactions", "stripe_event_id")
