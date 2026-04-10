"""Public materials browsing and search endpoints (no auth required)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.services import material_service

router = APIRouter()


# --- Response schemas ---


class IndexedMaterialSummary(BaseModel):
    id: str
    external_id: str
    source_db: str
    formula: str
    formula_anonymous: str | None
    elements: list[str]
    n_elements: int
    band_gap: float | None
    formation_energy: float | None
    energy_above_hull: float | None
    density: float | None
    space_group: str | None
    crystal_system: str | None
    is_stable: bool
    tags: list[str]

    model_config = {"from_attributes": True}


class IndexedMaterialDetail(BaseModel):
    id: str
    external_id: str
    source_db: str
    formula: str
    formula_anonymous: str | None
    elements: list[str]
    n_elements: int
    composition: dict
    band_gap: float | None
    formation_energy: float | None
    energy_above_hull: float | None
    density: float | None
    total_magnetization: float | None
    magnetic_ordering: str | None
    volume: float | None
    space_group: str | None
    crystal_system: str | None
    lattice_params: dict | None
    structure_data: dict | None

    # Mechanical properties
    bulk_modulus: float | None
    shear_modulus: float | None
    young_modulus: float | None
    poisson_ratio: float | None

    # Electronic properties
    dielectric_constant: float | None
    refractive_index: float | None

    # Thermal / thermoelectric
    thermal_conductivity: float | None
    seebeck_coefficient: float | None

    # Carrier properties
    effective_mass_electron: float | None
    effective_mass_hole: float | None

    # Electronic extras
    efermi: float | None
    is_gap_direct: bool | None

    # Decomposition
    decomposes_to: list | None

    # Provenance
    oxidation_states: dict | None
    calculation_method: str | None
    is_theoretical: bool | None
    experimentally_observed: bool | None
    icsd_ids: list | None
    database_ids: dict | None
    warnings: list[str] | None

    properties_json: dict
    source_url: str | None
    is_stable: bool
    tags: list[str]
    fetched_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class MaterialListResponse(BaseModel):
    materials: list[IndexedMaterialSummary]
    total: int
    page: int
    limit: int


class MaterialStatsResponse(BaseModel):
    total_materials: int
    stable_materials: int
    sources: dict[str, int]
    crystal_systems: dict[str, int]
    n_elements_distribution: dict[int, int]
    avg_band_gap: float | None


# --- Endpoints ---


@router.get("/stats", response_model=MaterialStatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Aggregate statistics for all indexed materials."""
    return material_service.get_stats(db)


@router.get("/elements")
def get_element_counts(db: Session = Depends(get_db)):
    """Element frequency map across all indexed materials."""
    return material_service.get_element_counts(db)


@router.get("", response_model=MaterialListResponse)
def search_materials(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    elements: Optional[str] = Query(None, description="Comma-separated element symbols, e.g. 'Li,O'"),
    formula: Optional[str] = None,
    crystal_system: Optional[str] = None,
    space_group: Optional[str] = None,
    band_gap_min: Optional[float] = None,
    band_gap_max: Optional[float] = None,
    formation_energy_min: Optional[float] = None,
    formation_energy_max: Optional[float] = None,
    energy_above_hull_max: Optional[float] = None,
    bulk_modulus_min: Optional[float] = None,
    bulk_modulus_max: Optional[float] = None,
    shear_modulus_min: Optional[float] = None,
    shear_modulus_max: Optional[float] = None,
    thermal_conductivity_min: Optional[float] = None,
    thermal_conductivity_max: Optional[float] = None,
    magnetic_ordering: Optional[str] = None,
    has_elastic_data: Optional[bool] = None,
    source_db: Optional[str] = None,
    is_stable: Optional[bool] = None,
    sort_by: str = Query("formula", description="Sort field"),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """Paginated search across all indexed materials. All parameters are optional."""
    parsed_elements = None
    if elements:
        parsed_elements = [e.strip() for e in elements.split(",") if e.strip()]

    results, total = material_service.search(
        db,
        page=page,
        limit=limit,
        elements=parsed_elements,
        formula=formula,
        crystal_system=crystal_system,
        space_group=space_group,
        band_gap_min=band_gap_min,
        band_gap_max=band_gap_max,
        formation_energy_min=formation_energy_min,
        formation_energy_max=formation_energy_max,
        energy_above_hull_max=energy_above_hull_max,
        bulk_modulus_min=bulk_modulus_min,
        bulk_modulus_max=bulk_modulus_max,
        shear_modulus_min=shear_modulus_min,
        shear_modulus_max=shear_modulus_max,
        thermal_conductivity_min=thermal_conductivity_min,
        thermal_conductivity_max=thermal_conductivity_max,
        magnetic_ordering=magnetic_ordering,
        has_elastic_data=has_elastic_data,
        source_db=source_db,
        is_stable=is_stable,
        sort_by=sort_by,
        sort_dir=sort_dir,
        q=q,
    )
    return MaterialListResponse(
        materials=results, total=total, page=page, limit=limit
    )


@router.get("/{material_id}", response_model=IndexedMaterialDetail)
def get_material(material_id: str, db: Session = Depends(get_db)):
    """Get full details for a single indexed material."""
    from app.services.data_quality import normalize_material

    mat = material_service.get_by_id(db, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    # Apply all data quality normalizations before responding
    normalize_material(mat)

    # For 3D viewer: compute the correct lattice box for the atoms
    # Atoms from MP are ALWAYS in primitive cell Cartesian coords
    # We need to give the viewer the primitive lattice to draw the box
    if mat.structure_data and mat.lattice_params:
        prim = mat.lattice_params.get("primitive")
        if prim:
            mat.structure_data["viewer_lattice"] = prim
        else:
            # Lattice wasn't converted — but atoms might still be primitive
            # For centered cells, derive primitive lattice from conventional
            from app.services.lattice_utils import conventional_to_primitive_lattice
            sg = mat.space_group or ""
            viewer_lat = conventional_to_primitive_lattice(
                mat.lattice_params, sg
            )
            mat.structure_data["viewer_lattice"] = viewer_lat

    # Strip internal pipeline fields — never expose to frontend
    if mat.properties_json and isinstance(mat.properties_json, dict):
        mat.properties_json = {
            k: v for k, v in mat.properties_json.items() if not k.startswith("_")
        }

    return mat


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Browse materials by category — crystal systems, element families, property classes."""
    from sqlalchemy import func

    # Crystal system counts
    cs_rows = (
        db.query(IndexedMaterial.crystal_system, func.count(IndexedMaterial.id))
        .filter(IndexedMaterial.crystal_system.isnot(None))
        .group_by(IndexedMaterial.crystal_system)
        .all()
    )

    # Source DB counts
    src_rows = (
        db.query(IndexedMaterial.source_db, func.count(IndexedMaterial.id))
        .group_by(IndexedMaterial.source_db)
        .all()
    )

    # Property availability
    total = db.query(func.count(IndexedMaterial.id)).scalar() or 0
    has_elastic = db.query(func.count(IndexedMaterial.id)).filter(IndexedMaterial.bulk_modulus.isnot(None)).scalar() or 0
    has_thermal = db.query(func.count(IndexedMaterial.id)).filter(IndexedMaterial.thermal_conductivity.isnot(None)).scalar() or 0
    has_magnetic = db.query(func.count(IndexedMaterial.id)).filter(IndexedMaterial.total_magnetization.isnot(None)).scalar() or 0
    has_dielectric = db.query(func.count(IndexedMaterial.id)).filter(IndexedMaterial.dielectric_constant.isnot(None)).scalar() or 0
    has_structure = db.query(func.count(IndexedMaterial.id)).filter(IndexedMaterial.structure_data.isnot(None)).scalar() or 0

    # Band gap classification
    metals = db.query(func.count(IndexedMaterial.id)).filter(IndexedMaterial.band_gap == 0).scalar() or 0
    semiconductors = db.query(func.count(IndexedMaterial.id)).filter(
        IndexedMaterial.band_gap > 0, IndexedMaterial.band_gap < 4.0
    ).scalar() or 0
    insulators = db.query(func.count(IndexedMaterial.id)).filter(IndexedMaterial.band_gap >= 4.0).scalar() or 0

    return {
        "total_materials": total,
        "crystal_systems": {row[0]: row[1] for row in cs_rows},
        "sources": {row[0]: row[1] for row in src_rows},
        "electronic_classification": {
            "metals": metals,
            "semiconductors": semiconductors,
            "insulators": insulators,
        },
        "property_coverage": {
            "elastic_moduli": has_elastic,
            "thermal_conductivity": has_thermal,
            "magnetization": has_magnetic,
            "dielectric_constant": has_dielectric,
            "crystal_structure_3d": has_structure,
        },
    }


@router.get("/{material_id}/related", response_model=list[IndexedMaterialSummary])
def get_related_materials(
    material_id: str,
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Get materials related by shared elements or crystal system."""
    mat = material_service.get_by_id(db, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    return material_service.get_related(db, mat, limit=limit)
