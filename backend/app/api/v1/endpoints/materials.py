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

    # Provenance
    oxidation_states: dict | None
    calculation_method: str | None
    is_theoretical: bool | None
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
    return mat


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
