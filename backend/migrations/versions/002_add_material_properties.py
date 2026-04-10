"""Add mechanical, electronic, thermal, and provenance columns to indexed_materials.

Revision ID: 002_add_props
Revises: 001_initial
Create Date: 2026-04-10
"""

from alembic import op
import sqlalchemy as sa

revision = "002_add_props"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Magnetic
    op.add_column("indexed_materials", sa.Column("magnetic_ordering", sa.String(30), nullable=True))

    # Mechanical
    op.add_column("indexed_materials", sa.Column("bulk_modulus", sa.Float, nullable=True))
    op.add_column("indexed_materials", sa.Column("shear_modulus", sa.Float, nullable=True))
    op.add_column("indexed_materials", sa.Column("young_modulus", sa.Float, nullable=True))
    op.add_column("indexed_materials", sa.Column("poisson_ratio", sa.Float, nullable=True))

    # Electronic
    op.add_column("indexed_materials", sa.Column("dielectric_constant", sa.Float, nullable=True))
    op.add_column("indexed_materials", sa.Column("refractive_index", sa.Float, nullable=True))

    # Thermal
    op.add_column("indexed_materials", sa.Column("thermal_conductivity", sa.Float, nullable=True))
    op.add_column("indexed_materials", sa.Column("seebeck_coefficient", sa.Float, nullable=True))

    # Carrier
    op.add_column("indexed_materials", sa.Column("effective_mass_electron", sa.Float, nullable=True))
    op.add_column("indexed_materials", sa.Column("effective_mass_hole", sa.Float, nullable=True))

    # Provenance
    op.add_column("indexed_materials", sa.Column("oxidation_states", sa.JSON, nullable=True))
    op.add_column("indexed_materials", sa.Column("calculation_method", sa.String(50), nullable=True))
    op.add_column("indexed_materials", sa.Column("is_theoretical", sa.Boolean, server_default="true"))
    op.add_column("indexed_materials", sa.Column("warnings", sa.JSON, nullable=True))


def downgrade() -> None:
    for col in [
        "magnetic_ordering",
        "bulk_modulus", "shear_modulus", "young_modulus", "poisson_ratio",
        "dielectric_constant", "refractive_index",
        "thermal_conductivity", "seebeck_coefficient",
        "effective_mass_electron", "effective_mass_hole",
        "oxidation_states", "calculation_method", "is_theoretical", "warnings",
    ]:
        op.drop_column("indexed_materials", col)
