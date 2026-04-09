"""Service layer for browsing and searching indexed materials."""

from __future__ import annotations

import logging
from typing import Any, Optional

from sqlalchemy import func, or_, text
from sqlalchemy.orm import Session

from app.db.models import IndexedMaterial

logger = logging.getLogger(__name__)


def search(
    db: Session,
    *,
    page: int = 1,
    limit: int = 20,
    elements: list[str] | None = None,
    formula: str | None = None,
    crystal_system: str | None = None,
    space_group: str | None = None,
    band_gap_min: float | None = None,
    band_gap_max: float | None = None,
    formation_energy_min: float | None = None,
    formation_energy_max: float | None = None,
    energy_above_hull_max: float | None = None,
    source_db: str | None = None,
    is_stable: bool | None = None,
    sort_by: str = "formula",
    sort_dir: str = "asc",
    q: str | None = None,
) -> tuple[list[IndexedMaterial], int]:
    """Paginated search with filters. Returns (results, total_count)."""
    query = db.query(IndexedMaterial)

    # Full-text / formula search
    if q:
        query = query.filter(
            or_(
                IndexedMaterial.formula.ilike(f"%{q}%"),
                IndexedMaterial.external_id.ilike(f"%{q}%"),
            )
        )

    # Element containment: every requested element must appear in the
    # material's formula.  This is a pragmatic approach that works across
    # database backends; for PostgreSQL you could use JSON containment
    # operators for better performance.
    if elements:
        for el in elements:
            query = query.filter(IndexedMaterial.formula.ilike(f"%{el}%"))

    if formula:
        query = query.filter(IndexedMaterial.formula.ilike(f"%{formula}%"))

    if crystal_system:
        query = query.filter(IndexedMaterial.crystal_system == crystal_system)

    if space_group:
        query = query.filter(IndexedMaterial.space_group == space_group)

    if band_gap_min is not None:
        query = query.filter(IndexedMaterial.band_gap >= band_gap_min)
    if band_gap_max is not None:
        query = query.filter(IndexedMaterial.band_gap <= band_gap_max)

    if formation_energy_min is not None:
        query = query.filter(IndexedMaterial.formation_energy >= formation_energy_min)
    if formation_energy_max is not None:
        query = query.filter(IndexedMaterial.formation_energy <= formation_energy_max)

    if energy_above_hull_max is not None:
        query = query.filter(IndexedMaterial.energy_above_hull <= energy_above_hull_max)

    if source_db:
        query = query.filter(IndexedMaterial.source_db == source_db)

    if is_stable is not None:
        query = query.filter(IndexedMaterial.is_stable == is_stable)

    total = query.count()

    # Sorting
    allowed_sort = {
        "formula", "band_gap", "formation_energy", "energy_above_hull",
        "density", "n_elements", "crystal_system", "space_group",
        "source_db", "external_id", "fetched_at",
    }
    if sort_by not in allowed_sort:
        sort_by = "formula"
    sort_col = getattr(IndexedMaterial, sort_by)
    order = sort_col.desc() if sort_dir == "desc" else sort_col.asc()
    results = query.order_by(order).offset((page - 1) * limit).limit(limit).all()

    return results, total


def get_by_id(db: Session, material_id: str) -> Optional[IndexedMaterial]:
    """Return a single indexed material by primary key or external_id."""
    mat = db.query(IndexedMaterial).filter(IndexedMaterial.id == material_id).first()
    if not mat:
        mat = (
            db.query(IndexedMaterial)
            .filter(IndexedMaterial.external_id == material_id)
            .first()
        )
    return mat


def get_related(
    db: Session,
    material: IndexedMaterial,
    limit: int = 12,
) -> list[IndexedMaterial]:
    """Find materials sharing elements or crystal system with the given one."""
    filters = []

    # Same crystal system
    if material.crystal_system:
        filters.append(IndexedMaterial.crystal_system == material.crystal_system)

    # Shares at least one element (check formula for each element)
    mat_elements: list[str] = material.elements or []
    for el in mat_elements[:3]:  # cap to avoid huge OR
        filters.append(IndexedMaterial.formula.ilike(f"%{el}%"))

    if not filters:
        return []

    return (
        db.query(IndexedMaterial)
        .filter(IndexedMaterial.id != material.id, or_(*filters))
        .order_by(func.random())
        .limit(limit)
        .all()
    )


def get_stats(db: Session) -> dict[str, Any]:
    """Aggregate statistics across all indexed materials."""
    total = db.query(func.count(IndexedMaterial.id)).scalar() or 0
    stable = (
        db.query(func.count(IndexedMaterial.id))
        .filter(IndexedMaterial.is_stable == True)  # noqa: E712
        .scalar()
        or 0
    )

    source_rows = (
        db.query(IndexedMaterial.source_db, func.count(IndexedMaterial.id))
        .group_by(IndexedMaterial.source_db)
        .all()
    )
    sources = {row[0]: row[1] for row in source_rows}

    crystal_rows = (
        db.query(IndexedMaterial.crystal_system, func.count(IndexedMaterial.id))
        .filter(IndexedMaterial.crystal_system.isnot(None))
        .group_by(IndexedMaterial.crystal_system)
        .all()
    )
    crystal_systems = {row[0]: row[1] for row in crystal_rows}

    n_el_rows = (
        db.query(IndexedMaterial.n_elements, func.count(IndexedMaterial.id))
        .group_by(IndexedMaterial.n_elements)
        .order_by(IndexedMaterial.n_elements)
        .all()
    )
    n_elements_dist = {row[0]: row[1] for row in n_el_rows}

    avg_band_gap = (
        db.query(func.avg(IndexedMaterial.band_gap))
        .filter(IndexedMaterial.band_gap.isnot(None))
        .scalar()
    )

    return {
        "total_materials": total,
        "stable_materials": stable,
        "sources": sources,
        "crystal_systems": crystal_systems,
        "n_elements_distribution": n_elements_dist,
        "avg_band_gap": round(float(avg_band_gap), 3) if avg_band_gap else None,
    }


def get_element_counts(db: Session) -> dict[str, int]:
    """Return frequency map of elements across all indexed materials.

    Since elements are stored as a JSON array, we iterate materials in
    batches to build the count.  For large datasets a materialized view
    or pre-computed table would be more efficient.
    """
    counts: dict[str, int] = {}
    batch_size = 2000
    offset = 0
    while True:
        rows = (
            db.query(IndexedMaterial.elements)
            .order_by(IndexedMaterial.id)
            .offset(offset)
            .limit(batch_size)
            .all()
        )
        if not rows:
            break
        for (elements,) in rows:
            if elements:
                for el in elements:
                    counts[el] = counts.get(el, 0) + 1
        offset += batch_size

    # Sort by count descending
    return dict(sorted(counts.items(), key=lambda x: x[1], reverse=True))
