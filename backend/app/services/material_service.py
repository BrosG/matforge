"""Service layer for browsing and searching indexed materials."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Optional

from sqlalchemy import func, or_, text
from sqlalchemy.orm import Session

from app.db.models import IndexedMaterial

logger = logging.getLogger(__name__)

_SEARCH_CACHE_PREFIX = "materials:search:v1:"
_SEARCH_CACHE_TTL = 30  # seconds — short enough to feel fresh, long enough to absorb spikes


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
    bulk_modulus_min: float | None = None,
    bulk_modulus_max: float | None = None,
    shear_modulus_min: float | None = None,
    shear_modulus_max: float | None = None,
    thermal_conductivity_min: float | None = None,
    thermal_conductivity_max: float | None = None,
    magnetic_ordering: str | None = None,
    has_elastic_data: bool | None = None,
    source_db: str | None = None,
    is_stable: bool | None = None,
    sort_by: str = "formula",
    sort_dir: str = "asc",
    q: str | None = None,
) -> tuple[list[IndexedMaterial], int]:
    """Paginated search with filters. Returns (results, total_count).

    Results for the first page of unfiltered/lightly-filtered queries are
    cached in Redis for 30 seconds to absorb traffic spikes without hammering
    Cloud SQL.
    """
    # ------------------------------------------------------------------ cache
    # Only cache page=1 with default sort (covers the hot path: browse all)
    _is_cacheable = (
        page == 1
        and sort_by == "formula"
        and sort_dir == "asc"
        and not any([
            q, elements, formula, crystal_system, space_group,
            band_gap_min, band_gap_max,
            formation_energy_min, formation_energy_max, energy_above_hull_max,
            bulk_modulus_min, bulk_modulus_max,
            shear_modulus_min, shear_modulus_max,
            thermal_conductivity_min, thermal_conductivity_max,
            magnetic_ordering, has_elastic_data, source_db,
            is_stable is not None,
        ])
    )
    _cache_key: str | None = None
    if _is_cacheable:
        # Hash all params so we get a stable key regardless of ordering
        _param_blob = json.dumps({
            "page": page, "limit": limit, "sort_by": sort_by, "sort_dir": sort_dir,
        }, sort_keys=True)
        _cache_key = _SEARCH_CACHE_PREFIX + hashlib.md5(_param_blob.encode()).hexdigest()
        try:
            from app.core.redis_connector import get_redis
            redis_client = get_redis()
            cached = redis_client.get(_cache_key)
            if cached:
                payload = json.loads(cached)
                # Redis stores serialized dicts; reconstruct IndexedMaterial stubs lazily
                # by fetching the IDs from the DB (single indexed PK lookup, very fast)
                ids = payload["ids"]
                total = payload["total"]
                if ids:
                    id_map = {
                        m.id: m
                        for m in db.query(IndexedMaterial)
                        .filter(IndexedMaterial.id.in_(ids))
                        .all()
                    }
                    results = [id_map[i] for i in ids if i in id_map]
                    return results, total
        except Exception as e:
            logger.warning("Search cache read failed: %s", e)

    # ------------------------------------------------------------------ query
    query = db.query(IndexedMaterial).execution_options(timeout=10000)

    # Full-text / formula search
    if q:
        query = query.filter(
            or_(
                IndexedMaterial.formula.ilike(f"%{q}%"),
                IndexedMaterial.external_id.ilike(f"%{q}%"),
            )
        )

    # Element containment
    if elements:
        for el in elements:
            query = query.filter(IndexedMaterial.formula.ilike(f"%{el}%"))

    if formula:
        query = query.filter(IndexedMaterial.formula.ilike(f"%{formula}%"))

    if crystal_system:
        query = query.filter(IndexedMaterial.crystal_system == crystal_system)

    if space_group:
        query = query.filter(IndexedMaterial.space_group == space_group)

    # Thermodynamic ranges
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

    # Mechanical ranges
    if bulk_modulus_min is not None:
        query = query.filter(IndexedMaterial.bulk_modulus >= bulk_modulus_min)
    if bulk_modulus_max is not None:
        query = query.filter(IndexedMaterial.bulk_modulus <= bulk_modulus_max)

    if shear_modulus_min is not None:
        query = query.filter(IndexedMaterial.shear_modulus >= shear_modulus_min)
    if shear_modulus_max is not None:
        query = query.filter(IndexedMaterial.shear_modulus <= shear_modulus_max)

    # Thermal ranges
    if thermal_conductivity_min is not None:
        query = query.filter(IndexedMaterial.thermal_conductivity >= thermal_conductivity_min)
    if thermal_conductivity_max is not None:
        query = query.filter(IndexedMaterial.thermal_conductivity <= thermal_conductivity_max)

    # Magnetic
    if magnetic_ordering:
        query = query.filter(IndexedMaterial.magnetic_ordering == magnetic_ordering)

    # Has elastic data filter
    if has_elastic_data is True:
        query = query.filter(IndexedMaterial.bulk_modulus.isnot(None))

    if source_db:
        query = query.filter(IndexedMaterial.source_db == source_db)

    if is_stable is not None:
        query = query.filter(IndexedMaterial.is_stable == is_stable)

    # Use fast approximate row count when no filters are applied
    # (avoids full-table sequential scan which takes 25+ seconds)
    _has_filters = any([
        q, elements, crystal_system, band_gap_min, band_gap_max,
        formation_energy_min, formation_energy_max, bulk_modulus_min,
        bulk_modulus_max, shear_modulus_min, shear_modulus_max,
        thermal_conductivity_min, thermal_conductivity_max,
        magnetic_ordering, has_elastic_data, is_stable is not None, source_db,
    ])
    if _has_filters:
        total = query.count()
    else:
        # pg_class reltuples is updated by VACUUM/ANALYZE — fast O(1) lookup
        try:
            result = db.execute(
                text("SELECT reltuples::bigint FROM pg_class WHERE relname = 'indexed_materials'")
            ).scalar()
            total = int(result) if result and result > 0 else query.count()
        except Exception:
            total = query.count()

    # Sorting
    allowed_sort = {
        "formula", "band_gap", "formation_energy", "energy_above_hull",
        "density", "n_elements", "crystal_system", "space_group",
        "source_db", "external_id", "fetched_at",
        "bulk_modulus", "shear_modulus", "young_modulus",
        "thermal_conductivity", "seebeck_coefficient",
        "total_magnetization", "dielectric_constant",
    }
    if sort_by not in allowed_sort:
        sort_by = "formula"
    sort_col = getattr(IndexedMaterial, sort_by)
    order = sort_col.desc() if sort_dir == "desc" else sort_col.asc()
    results = query.order_by(order).offset((page - 1) * limit).limit(limit).all()

    # ---------------------------------------------------------- cache write
    if _cache_key and results:
        try:
            from app.core.redis_connector import get_redis
            redis_client = get_redis()
            payload = json.dumps({"ids": [m.id for m in results], "total": total})
            redis_client.setex(_cache_key, _SEARCH_CACHE_TTL, payload)
        except Exception as e:
            logger.warning("Search cache write failed: %s", e)

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


_RELATED_CACHE_PREFIX = "materials:related:v1:"
_RELATED_CACHE_TTL = 300  # 5 minutes


def get_related(
    db: Session,
    material: IndexedMaterial,
    limit: int = 12,
) -> list[IndexedMaterial]:
    """Find related materials — fast, cached, no ORDER BY random().

    Strategy: filter by crystal_system (indexed), limit to a small set,
    then shuffle in Python. Avoids the catastrophic ORDER BY random()
    full-table scan that took 37+ seconds.
    """
    # Try Redis cache first
    cache_key = _RELATED_CACHE_PREFIX + material.id
    try:
        from app.core.redis_connector import get_redis
        import json as _json

        cached = _json.loads(get_redis().get(cache_key) or "null")
        if cached:
            ids = cached[:limit]
            if ids:
                id_map = {m.id: m for m in db.query(IndexedMaterial).filter(IndexedMaterial.id.in_(ids)).all()}
                return [id_map[i] for i in ids if i in id_map]
    except Exception:
        pass

    import random

    # Fast query: same crystal system (uses idx_mat_search_main index)
    candidates = []
    if material.crystal_system:
        candidates = (
            db.query(IndexedMaterial)
            .filter(
                IndexedMaterial.crystal_system == material.crystal_system,
                IndexedMaterial.id != material.id,
            )
            .limit(200)  # fetch a small pool, shuffle in Python
            .all()
        )

    # If not enough, supplement with same n_elements
    if len(candidates) < limit:
        extra = (
            db.query(IndexedMaterial)
            .filter(
                IndexedMaterial.n_elements == material.n_elements,
                IndexedMaterial.id != material.id,
            )
            .limit(100)
            .all()
        )
        seen = {c.id for c in candidates}
        candidates.extend(c for c in extra if c.id not in seen)

    # Shuffle and pick
    random.shuffle(candidates)
    results = candidates[:limit]

    # Cache the IDs
    try:
        from app.core.redis_connector import get_redis
        import json as _json

        get_redis().setex(cache_key, _RELATED_CACHE_TTL, _json.dumps([m.id for m in results]))
    except Exception:
        pass

    return results


_STATS_CACHE_KEY = "materials:stats:v1"
_STATS_CACHE_TTL = 300  # 5 minutes


def get_stats(db: Session) -> dict[str, Any]:
    """Aggregate statistics across all indexed materials (Redis cached)."""
    # Try cache first
    try:
        from app.core.redis_connector import get_redis
        import json as _json

        redis_client = get_redis()
        cached = redis_client.get(_STATS_CACHE_KEY)
        if cached:
            return _json.loads(cached)
    except Exception as e:
        logger.warning("Stats cache read failed: %s", e)

    # Compute fresh stats
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

    result = {
        "total_materials": total,
        "stable_materials": stable,
        "sources": sources,
        "crystal_systems": crystal_systems,
        "n_elements_distribution": n_elements_dist,
        "avg_band_gap": round(float(avg_band_gap), 3) if avg_band_gap else None,
    }

    # Cache for 5 minutes
    try:
        from app.core.redis_connector import get_redis
        import json as _json

        redis_client = get_redis()
        redis_client.setex(_STATS_CACHE_KEY, _STATS_CACHE_TTL, _json.dumps(result))
    except Exception as e:
        logger.warning("Stats cache write failed: %s", e)

    return result


_ELEMENTS_CACHE_KEY = "materials:elements:v1"
_ELEMENTS_CACHE_TTL = 600  # 10 minutes


def get_element_counts(db: Session) -> dict[str, int]:
    """Return frequency map of elements across all indexed materials.

    Uses a single SQL query with jsonb_array_elements_text instead of
    iterating all rows in Python.  Results are cached in Redis for 10 min.
    """
    # Try cache first
    try:
        from app.core.redis_connector import get_redis
        import json as _json

        redis_client = get_redis()
        cached = redis_client.get(_ELEMENTS_CACHE_KEY)
        if cached:
            return _json.loads(cached)
    except Exception as e:
        logger.warning("Element counts cache read failed: %s", e)

    # Single SQL query — orders of magnitude faster than Python iteration
    result = db.execute(text(
        "SELECT elem, COUNT(*) as cnt "
        "FROM indexed_materials, jsonb_array_elements_text(elements) AS elem "
        "GROUP BY elem ORDER BY cnt DESC"
    ))
    counts = {row[0]: row[1] for row in result}

    # Cache for 10 minutes
    try:
        from app.core.redis_connector import get_redis
        import json as _json

        redis_client = get_redis()
        redis_client.setex(_ELEMENTS_CACHE_KEY, _ELEMENTS_CACHE_TTL, _json.dumps(counts))
    except Exception as e:
        logger.warning("Element counts cache write failed: %s", e)

    return counts


_CATEGORIES_CACHE_KEY = "materials:categories:v1"
_CATEGORIES_CACHE_TTL = 300  # 5 minutes


def get_categories(db: Session) -> dict[str, Any]:
    """Aggregate category counts in a single SQL query. Cached for 5 min."""
    # Try cache first
    try:
        from app.core.redis_connector import get_redis
        import json as _json

        redis_client = get_redis()
        cached = redis_client.get(_CATEGORIES_CACHE_KEY)
        if cached:
            return _json.loads(cached)
    except Exception as e:
        logger.warning("Categories cache read failed: %s", e)

    # Single query with FILTER aggregation — replaces 10+ separate COUNT queries
    row = db.execute(text("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE band_gap = 0) AS metals,
            COUNT(*) FILTER (WHERE band_gap > 0 AND band_gap < 4.0) AS semiconductors,
            COUNT(*) FILTER (WHERE band_gap >= 4.0) AS insulators,
            COUNT(*) FILTER (WHERE bulk_modulus IS NOT NULL) AS has_elastic,
            COUNT(*) FILTER (WHERE thermal_conductivity IS NOT NULL) AS has_thermal,
            COUNT(*) FILTER (WHERE total_magnetization IS NOT NULL) AS has_magnetic,
            COUNT(*) FILTER (WHERE dielectric_constant IS NOT NULL) AS has_dielectric,
            COUNT(*) FILTER (WHERE structure_data IS NOT NULL) AS has_structure
        FROM indexed_materials
    """)).fetchone()

    # Crystal system counts
    cs_rows = db.execute(text(
        "SELECT crystal_system, COUNT(*) FROM indexed_materials "
        "WHERE crystal_system IS NOT NULL GROUP BY crystal_system"
    )).fetchall()

    # Source DB counts
    src_rows = db.execute(text(
        "SELECT source_db, COUNT(*) FROM indexed_materials GROUP BY source_db"
    )).fetchall()

    result = {
        "total_materials": row[0],
        "crystal_systems": {r[0]: r[1] for r in cs_rows},
        "sources": {r[0]: r[1] for r in src_rows},
        "electronic_classification": {
            "metals": row[1],
            "semiconductors": row[2],
            "insulators": row[3],
        },
        "property_coverage": {
            "elastic_moduli": row[4],
            "thermal_conductivity": row[5],
            "magnetization": row[6],
            "dielectric_constant": row[7],
            "crystal_structure_3d": row[8],
        },
    }

    # Cache for 5 minutes
    try:
        from app.core.redis_connector import get_redis
        import json as _json

        redis_client = get_redis()
        redis_client.setex(_CATEGORIES_CACHE_KEY, _CATEGORIES_CACHE_TTL, _json.dumps(result))
    except Exception as e:
        logger.warning("Categories cache write failed: %s", e)

    return result
