"""Celery tasks for bulk material ingestion from public APIs.

Paginates through Materials Project, AFLOW, and JARVIS to ingest
ALL available materials into the IndexedMaterial table. Runs as a
background job so it doesn't block API startup.

Materials Project: ~155,000 materials (requires API key)
AFLOW:            ~3.5M entries (no key, but slow API)
JARVIS:           ~80,000 materials (no key)
"""

from __future__ import annotations

import logging
import os
import time

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.ingest_materials.ingest_all",
    bind=True,
    max_retries=2,
    default_retry_delay=60,
    queue="default",
)
def ingest_all(self, sources: list[str] | None = None, max_per_source: int = 0):
    """Ingest materials from all public APIs.

    Args:
        sources: List of sources to ingest from. Default: all.
        max_per_source: Max materials per source. 0 = unlimited.
    """
    from app.db.base import get_db_context

    if sources is None:
        sources = ["materials_project", "aflow", "jarvis"]

    total = 0
    for source in sources:
        try:
            with get_db_context() as db:
                count = _ingest_source(db, source, max_per_source)
                total += count
                logger.info("Ingested %d from %s (total: %d)", count, source, total)
        except Exception as e:
            logger.error("Failed to ingest from %s: %s", source, e)

    return {"total_ingested": total, "sources": sources}


def _ingest_source(db, source: str, max_total: int) -> int:
    """Paginate through a single source and ingest all materials."""
    from app.services.ingest_service import ingest_batch

    if source == "materials_project":
        return _ingest_materials_project(db, max_total)
    elif source == "aflow":
        return _ingest_aflow(db, max_total)
    elif source == "jarvis":
        return _ingest_jarvis(db, max_total)
    else:
        logger.warning("Unknown source: %s", source)
        return 0


def _ingest_materials_project(db, max_total: int) -> int:
    """Paginate through ALL Materials Project materials.

    MP v2 API supports _skip and _limit for pagination.
    Rate limit: ~30 req/sec with API key.
    """
    from app.services.ingest_service import ingest_batch

    api_key = os.environ.get("MATERIALS_PROJECT_API_KEY", "")
    if not api_key:
        logger.warning("MATERIALS_PROJECT_API_KEY not set — skipping")
        return 0

    import json
    from urllib.parse import urlencode
    from urllib.request import Request, urlopen

    base_url = "https://api.materialsproject.org/materials/summary/"
    fields = (
        "material_id,formula_pretty,"
        "formation_energy_per_atom,band_gap,energy_above_hull,density,volume,is_stable,"
        "bulk_modulus,shear_modulus,homogeneous_poisson,"
        "total_magnetization,ordering,"
        "e_electronic,n,"
        "symmetry,structure,"
        "theoretical,oxidation_states"
    )

    page_size = 1000
    offset = 0
    total = 0

    while True:
        if max_total > 0 and total >= max_total:
            break

        params = {
            "_fields": fields,
            "_skip": str(offset),
            "_limit": str(page_size),
        }
        url = f"{base_url}?{urlencode(params)}"
        req = Request(url)
        req.add_header("X-API-KEY", api_key)
        req.add_header("Accept", "application/json")
        req.add_header("User-Agent", "MatCraft/1.0")

        try:
            with urlopen(req, timeout=120) as response:
                data = json.loads(response.read().decode())
        except Exception as e:
            logger.error("MP API error at offset %d: %s", offset, e)
            break

        items = data.get("data", [])
        if not items:
            break

        from materia.connectors.materials_project import MaterialsProjectConnector

        batch = []
        for item in items:
            entry = MaterialsProjectConnector._parse_item(item)
            batch.append({
                "external_id": entry.external_id,
                "formula": entry.formula,
                "properties": entry.properties,
                "structure": entry.structure if entry.structure else None,
                "metadata": entry.metadata,
            })

        count = ingest_batch(db, batch, "materials_project")
        total += count
        offset += page_size

        logger.info("MP progress: %d ingested (%d this batch, offset %d)", total, count, offset)

        # Rate limiting: ~1 req/sec to be polite
        time.sleep(1.0)

        if len(items) < page_size:
            break  # Last page

    return total


def _ingest_aflow(db, max_total: int) -> int:
    """Paginate through AFLOW materials.

    AFLUX API uses $paging(page, per_page) for pagination.
    """
    from app.services.ingest_service import ingest_batch

    import json
    from urllib.request import Request, urlopen

    base_url = "http://aflowlib.org/API/aflux/"
    props = (
        "auid,compound,enthalpy_formation_atom,Egap,density,"
        "ael_bulk_modulus_vrh,ael_shear_modulus_vrh,ael_poisson_ratio,"
        "ael_youngs_modulus_vrh,"
        "agl_thermal_conductivity_300K,"
        "spin_atom,spacegroup_relax,Bravais_lattice_orig"
    )

    page_size = 500
    page = 1
    total = 0

    while True:
        if max_total > 0 and total >= max_total:
            break

        paging = f"$paging({page},{page_size})"
        url = f"{base_url}?{paging},{props}"

        try:
            req = Request(url)
            req.add_header("Accept", "application/json")
            with urlopen(req, timeout=120) as response:
                data = json.loads(response.read().decode())
        except Exception as e:
            logger.error("AFLOW API error at page %d: %s", page, e)
            break

        items = data if isinstance(data, list) else []
        if not items:
            break

        from materia.connectors.aflow import AflowConnector

        batch = []
        for item in items:
            entry = AflowConnector._parse_item(item)
            batch.append({
                "external_id": entry.external_id,
                "formula": entry.formula,
                "properties": entry.properties,
                "structure": entry.structure if entry.structure else None,
                "metadata": entry.metadata,
            })

        count = ingest_batch(db, batch, "aflow")
        total += count
        page += 1

        logger.info("AFLOW progress: %d ingested (page %d)", total, page)
        time.sleep(2.0)  # AFLOW is slower, be polite

        if len(items) < page_size:
            break

        # Cap AFLOW at 50k to avoid overwhelming the DB on first run
        if max_total == 0 and total >= 50000:
            logger.info("AFLOW capped at 50k for initial ingestion")
            break

    return total


def _ingest_jarvis(db, max_total: int) -> int:
    """Ingest from JARVIS-DFT via Figshare dataset download.

    JARVIS has no REST API — we download their full dataset (JSON)
    from Figshare and iterate in memory.
    """
    from app.services.ingest_service import ingest_batch

    import json
    import gzip
    from urllib.request import Request, urlopen

    # JARVIS-DFT 3D dataset on Figshare (official NIST download)
    dataset_url = "https://figshare.com/ndownloader/files/26808917"

    logger.info("Downloading JARVIS dataset from Figshare (~100MB)...")
    try:
        req = Request(dataset_url)
        req.add_header("User-Agent", "MatCraft/1.0")
        with urlopen(req, timeout=600) as response:
            data_bytes = response.read()
    except Exception as e:
        logger.error("JARVIS download failed: %s", e)
        return 0

    # Dataset is a gzipped JSON
    try:
        if data_bytes[:2] == b"\x1f\x8b":
            data_bytes = gzip.decompress(data_bytes)
        items = json.loads(data_bytes.decode("utf-8"))
    except Exception as e:
        logger.error("JARVIS parse failed: %s", e)
        return 0

    if not isinstance(items, list):
        logger.error("JARVIS dataset unexpected format: %s", type(items))
        return 0

    logger.info("JARVIS dataset: %d materials", len(items))

    prop_keys = {
        "formation_energy_peratom": "formation_energy",
        "optb88vdw_bandgap": "band_gap",
        "ehull": "energy_above_hull",
        "bulk_modulus_kv": "bulk_modulus",
        "shear_modulus_gv": "shear_modulus",
        "density": "density",
        "dfpt_piezo_max_dielectric": "dielectric_constant",
        "magmom_oszicar": "total_magnetization",
        "n_Seebeck": "seebeck_coefficient",
    }

    batch_size = 500
    total = 0
    batch: list[dict] = []

    for item in items:
        if max_total > 0 and total >= max_total:
            break

        jid = item.get("jid", item.get("id", ""))
        formula = item.get("formula", item.get("composition", ""))
        if not jid or not formula:
            continue

        properties: dict[str, float] = {}
        for src_key, dst_key in prop_keys.items():
            val = item.get(src_key)
            if val is not None and isinstance(val, (int, float)):
                properties[dst_key] = float(val)

        # JARVIS atoms format: {"elements": [...], "coords": [[x,y,z], ...], "lattice_mat": [[...]]}
        atoms_data = item.get("atoms")
        structure: dict | None = None
        if atoms_data and isinstance(atoms_data, dict):
            structure = {
                "lattice": {"matrix": atoms_data.get("lattice_mat", [])},
                "sites": [],
            }
            elements = atoms_data.get("elements", [])
            coords = atoms_data.get("coords", [])
            for el, coord in zip(elements, coords):
                structure["sites"].append({
                    "species": [{"element": el}],
                    "abc": coord,
                    "xyz": coord,
                })

        batch.append({
            "external_id": str(jid),
            "formula": formula,
            "properties": properties,
            "structure": structure,
            "metadata": {"calculation_method": "OptB88vdW (JARVIS)"},
        })

        if len(batch) >= batch_size:
            count = ingest_batch(db, batch, "jarvis")
            total += count
            batch = []
            if total % 5000 == 0:
                logger.info("JARVIS progress: %d ingested", total)

    # Final partial batch
    if batch:
        count = ingest_batch(db, batch, "jarvis")
        total += count

    logger.info("JARVIS complete: %d materials ingested", total)
    return total
