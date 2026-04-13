"""Data quality normalization for indexed materials.

Fixes systematic issues in DFT data before display:
1. Lattice parameters: primitive → conventional cell conversion
2. Magnetization noise: rounds sub-threshold values to 0
3. Magnetic ordering: classifies based on magnetization magnitude
4. Disorder/provenance warnings
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import IndexedMaterial
from app.services.lattice_utils import normalize_lattice_for_display

logger = logging.getLogger(__name__)

# Below this threshold (in μB), magnetization is considered DFT noise
# 0.05 is the standard threshold used by Materials Project for non-magnetic classification
MAGNETIZATION_NOISE_THRESHOLD = 0.05


def normalize_material(mat: IndexedMaterial) -> IndexedMaterial:
    """Apply all data quality normalizations to a material in-place."""
    _normalize_lattice(mat)
    _normalize_magnetization(mat)
    _normalize_tags(mat)
    _normalize_warnings(mat)
    return mat


def _normalize_lattice(mat: IndexedMaterial) -> None:
    """Convert primitive cell → conventional cell if mismatch detected."""
    if not mat.lattice_params:
        return
    mat.lattice_params = normalize_lattice_for_display(
        mat.lattice_params,
        crystal_system=mat.crystal_system,
        space_group=mat.space_group,
    )


def _normalize_magnetization(mat: IndexedMaterial) -> None:
    """Round DFT magnetization noise to 0 and classify magnetic ordering."""
    if mat.total_magnetization is None:
        return

    mag = abs(mat.total_magnetization)

    # Sub-threshold = numerical noise, not real magnetism
    if mag < MAGNETIZATION_NOISE_THRESHOLD:
        mat.total_magnetization = 0.0
        mat.magnetic_ordering = "non-magnetic"
        return

    # Classify if not already set
    if not mat.magnetic_ordering:
        if mag > 0.5:
            mat.magnetic_ordering = "ferromagnetic"
        elif mag > MAGNETIZATION_NOISE_THRESHOLD:
            mat.magnetic_ordering = "paramagnetic"


def _normalize_tags(mat: IndexedMaterial) -> None:
    """Validate tags against actual data — remove tags that promise data we don't have."""
    if not mat.tags:
        return

    tags = list(mat.tags)
    validated: list[str] = []

    for tag in tags:
        if tag == "thermoelectric":
            # Only keep if we have at least one thermoelectric property
            if mat.seebeck_coefficient is not None or mat.thermal_conductivity is not None:
                validated.append(tag)
            # else: silently drop — tag promises data we can't deliver
        elif tag == "elastic-data":
            if mat.bulk_modulus is not None or mat.shear_modulus is not None:
                validated.append(tag)
        elif tag == "thermal-data":
            if mat.thermal_conductivity is not None:
                validated.append(tag)
        else:
            validated.append(tag)

    mat.tags = validated


def _normalize_warnings(mat: IndexedMaterial) -> None:
    """Generate warnings based on data quality indicators."""
    warnings: list[str] = list(mat.warnings or [])
    existing = set(warnings)

    # Stability warning
    if mat.energy_above_hull is not None and mat.energy_above_hull > 0.1:
        w = "Thermodynamically unstable (Ehull > 0.1 eV/atom)"
        if w not in existing:
            warnings.append(w)

    # Disorder / theoretical structure warning
    if mat.is_theoretical:
        w = "Computationally predicted structure — not experimentally verified"
        if w not in existing:
            warnings.append(w)

    # Space group disorder indicators
    sg = mat.space_group or ""
    if "disordered" in sg.lower() or mat.crystal_system == "triclinic":
        w = "Structure may contain site disorder or partial occupancy"
        if w not in existing:
            warnings.append(w)

    # Lattice angle sanity check (flag if still inconsistent after conversion)
    if mat.lattice_params and mat.crystal_system:
        cs = mat.crystal_system.lower()
        alpha = mat.lattice_params.get("alpha", 90)
        beta = mat.lattice_params.get("beta", 90)
        gamma = mat.lattice_params.get("gamma", 90)
        converted = mat.lattice_params.get("converted", False)

        if cs == "cubic" and not converted:
            if any(abs(a - 90) > 2 for a in [alpha, beta, gamma]):
                w = "Lattice angles inconsistent with cubic crystal system — primitive cell displayed"
                if w not in existing:
                    warnings.append(w)

    # DFT method caveat
    method = mat.calculation_method or ""
    if method and "GGA" in method.upper():
        w = f"Calculated with {method} — band gaps may be underestimated"
        if w not in existing:
            warnings.append(w)

    mat.warnings = warnings if warnings else None


def normalize_all_materials(db: Session, batch_size: int = 500) -> int:
    """Normalize all existing indexed materials in the database.

    Applies lattice, magnetization, and warning fixes to every record.
    Returns count of updated materials.
    """
    offset = 0
    total_updated = 0

    while True:
        materials = (
            db.query(IndexedMaterial)
            .order_by(IndexedMaterial.id)
            .offset(offset)
            .limit(batch_size)
            .all()
        )
        if not materials:
            break

        for mat in materials:
            normalize_material(mat)
            total_updated += 1

        db.commit()
        offset += batch_size
        logger.info("Normalized %d materials so far...", total_updated)

    logger.info("Normalization complete: %d materials updated", total_updated)
    return total_updated
