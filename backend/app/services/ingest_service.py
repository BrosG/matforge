"""Ingestion service: DatasetEntry -> IndexedMaterial.

Maps connector output (DatasetEntry) to the global indexed materials database.
This is the single source of truth for how external data becomes queryable
in MatCraft's materials explorer.
"""

from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import IndexedMaterial

logger = logging.getLogger(__name__)


def _parse_formula(formula: str) -> dict[str, float]:
    """Parse 'Fe2O3' -> {'Fe': 0.4, 'O': 0.6}."""
    pattern = r"([A-Z][a-z]?)(\d*\.?\d*)"
    matches = re.findall(pattern, formula)
    counts: dict[str, float] = {}
    for elem, count in matches:
        if elem:
            counts[elem] = float(count) if count else 1.0
    total = sum(counts.values())
    return {k: v / total for k, v in counts.items()} if total > 0 else {}


def _anonymous_formula(elements: list[str]) -> str:
    labels = "ABCDEFGH"
    return "".join(labels[i] if i < len(labels) else f"X{i}" for i in range(len(elements)))


def _safe_float(val: Any) -> float | None:
    if val is None:
        return None
    try:
        f = float(val)
        return f if f == f else None  # NaN check
    except (ValueError, TypeError):
        return None


def _source_url(source_db: str, external_id: str) -> str | None:
    urls = {
        "materials_project": f"https://next-gen.materialsproject.org/materials/{external_id}",
        "aflow": f"http://aflow.org/material/?id={external_id}",
        "oqmd": f"https://oqmd.org/materials/entry/{external_id.replace('oqmd-', '')}",
        "jarvis": f"https://jarvis.nist.gov/jarvisdft/id/{external_id}",
        "gnome": None,
        "opendac": None,
    }
    return urls.get(source_db)


def ingest_entry(
    db: Session,
    *,
    external_id: str,
    formula: str,
    source_db: str,
    properties: dict[str, float],
    structure: dict | None = None,
    metadata: dict | None = None,
) -> IndexedMaterial | None:
    """Ingest a single DatasetEntry into IndexedMaterial.

    Upserts: if external_id exists, updates properties. Otherwise inserts.
    Returns the IndexedMaterial record, or None if formula is empty.
    """
    if not formula or not external_id:
        return None

    meta = metadata or {}
    composition = _parse_formula(formula)
    elements = sorted(composition.keys())

    existing = (
        db.query(IndexedMaterial)
        .filter(IndexedMaterial.external_id == external_id)
        .first()
    )

    record = existing or IndexedMaterial(
        id=str(uuid.uuid4()),
        external_id=external_id,
        source_db=source_db,
        formula=formula,
        created_at=datetime.now(timezone.utc),
    )

    # Core identity
    record.formula = formula
    record.formula_anonymous = _anonymous_formula(elements)
    record.elements = elements
    record.n_elements = len(elements)
    record.composition = composition
    record.source_db = source_db

    # Thermodynamic properties
    record.band_gap = _safe_float(properties.get("band_gap"))
    record.formation_energy = _safe_float(properties.get("formation_energy"))
    record.energy_above_hull = _safe_float(properties.get("energy_above_hull"))
    record.density = _safe_float(properties.get("density"))
    record.volume = _safe_float(properties.get("volume"))

    # Mechanical
    record.bulk_modulus = _safe_float(properties.get("bulk_modulus"))
    record.shear_modulus = _safe_float(properties.get("shear_modulus"))
    record.young_modulus = _safe_float(properties.get("young_modulus"))
    record.poisson_ratio = _safe_float(properties.get("poisson_ratio"))

    # Electronic
    record.dielectric_constant = _safe_float(properties.get("dielectric_constant"))
    record.refractive_index = _safe_float(properties.get("refractive_index"))
    record.total_magnetization = _safe_float(properties.get("total_magnetization"))

    # Thermal
    record.thermal_conductivity = _safe_float(properties.get("thermal_conductivity"))
    record.seebeck_coefficient = _safe_float(properties.get("seebeck_coefficient"))

    # Carrier
    record.effective_mass_electron = _safe_float(properties.get("effective_mass_electron"))
    record.effective_mass_hole = _safe_float(properties.get("effective_mass_hole"))

    # Metadata-driven fields
    record.magnetic_ordering = meta.get("magnetic_ordering")
    record.space_group = meta.get("space_group")
    record.crystal_system = meta.get("crystal_system")
    record.oxidation_states = meta.get("oxidation_states")
    record.calculation_method = meta.get("calculation_method")
    record.is_theoretical = meta.get("is_theoretical", True)
    record.is_stable = meta.get("is_stable", False)

    # Stability from energy above hull
    if record.energy_above_hull is not None and record.energy_above_hull <= 0.0:
        record.is_stable = True

    # Structure: extract lattice and atoms from pymatgen-format dict
    if structure and isinstance(structure, dict):
        from app.services.lattice_utils import (
            extract_atoms_from_structure,
            extract_lattice_from_structure,
            normalize_lattice_for_display,
        )

        # Extract lattice params from 3x3 matrix
        lattice = extract_lattice_from_structure(structure)
        if lattice:
            # Convert primitive → conventional if needed
            lattice = normalize_lattice_for_display(
                lattice,
                crystal_system=record.crystal_system,
                space_group=record.space_group,
            )
            record.lattice_params = lattice

        # Extract atom positions for 3D viewer
        atoms = extract_atoms_from_structure(structure)
        if atoms:
            record.structure_data = {"atoms": atoms}
    elif meta.get("lattice_params"):
        from app.services.lattice_utils import normalize_lattice_for_display

        record.lattice_params = normalize_lattice_for_display(
            meta["lattice_params"],
            crystal_system=record.crystal_system,
            space_group=record.space_group,
        )

    # Apply data quality normalization (magnetization noise, warnings, tags)
    from app.services.data_quality import normalize_material
    normalize_material(record)

    # Source URL
    record.source_url = _source_url(source_db, external_id)

    # Store full properties dict as JSON catch-all
    record.properties_json = properties

    record.updated_at = datetime.now(timezone.utc)

    if not existing:
        record.fetched_at = datetime.now(timezone.utc)
        db.add(record)

    return record


def ingest_batch(
    db: Session,
    entries: list[dict],
    source_db: str,
    *,
    commit: bool = True,
) -> int:
    """Ingest a batch of entries. Returns count of ingested records.

    Each entry dict must have: external_id, formula, properties.
    Optional: structure, metadata.
    """
    count = 0
    for entry in entries:
        record = ingest_entry(
            db,
            external_id=entry["external_id"],
            formula=entry["formula"],
            source_db=source_db,
            properties=entry.get("properties", {}),
            structure=entry.get("structure"),
            metadata=entry.get("metadata"),
        )
        if record:
            count += 1

    if commit and count > 0:
        db.commit()

    logger.info("Ingested %d/%d entries from %s", count, len(entries), source_db)
    return count
