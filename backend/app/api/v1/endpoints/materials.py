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

    # Fix old data with wrong lattice params (a=b=c for tetragonal, etc.)
    if mat.lattice_params and mat.crystal_system:
        from app.services.lattice_utils import normalize_lattice_for_display
        mat.lattice_params = normalize_lattice_for_display(
            mat.lattice_params,
            crystal_system=mat.crystal_system,
            space_group=mat.space_group,
        )

    # For 3D viewer: the atoms are in Cartesian coords of the primitive cell
    # The lattice_matrix (if stored) is the correct 3x3 matrix for those atoms
    # If not stored, we compute a primitive lattice from space group (fallback)
    if mat.structure_data and mat.lattice_params:
        # Primary: use the raw matrix stored at ingestion
        if not mat.structure_data.get("lattice_matrix"):
            # Fallback for old data: derive primitive lattice params
            prim = mat.lattice_params.get("primitive")
            if prim:
                mat.structure_data["viewer_lattice"] = prim
            else:
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


@router.get("/{material_id}/export/{fmt}")
def export_material_structure(
    material_id: str,
    fmt: str,
    db: Session = Depends(get_db),
):
    """Export material structure as CIF, POSCAR, or XYZ.

    Generates crystallographic file formats from the stored structure data.
    """
    from starlette.responses import Response

    mat = material_service.get_by_id(db, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    if fmt not in ("cif", "poscar", "xyz"):
        raise HTTPException(status_code=400, detail="Format must be cif, poscar, or xyz")

    lp = mat.lattice_params or {}
    sd = mat.structure_data or {}
    atoms = sd.get("atoms", [])
    matrix = sd.get("lattice_matrix")

    a = lp.get("a", 1)
    b = lp.get("b", 1)
    c = lp.get("c", 1)
    alpha = lp.get("alpha", 90)
    beta = lp.get("beta", 90)
    gamma = lp.get("gamma", 90)

    if fmt == "cif":
        lines = [
            f"data_{mat.formula.replace(' ', '_')}",
            f"_cell_length_a {a}",
            f"_cell_length_b {b}",
            f"_cell_length_c {c}",
            f"_cell_angle_alpha {alpha}",
            f"_cell_angle_beta {beta}",
            f"_cell_angle_gamma {gamma}",
            f"_symmetry_space_group_name_H-M '{mat.space_group or 'P1'}'",
            "",
            "loop_",
            "_atom_site_label",
            "_atom_site_type_symbol",
            "_atom_site_fract_x",
            "_atom_site_fract_y",
            "_atom_site_fract_z",
        ]
        for i, atom in enumerate(atoms):
            el = atom.get("element", "X")
            fx = atom.get("fx", atom.get("x", 0))
            fy = atom.get("fy", atom.get("y", 0))
            fz = atom.get("fz", atom.get("z", 0))
            lines.append(f"{el}{i+1} {el} {fx:.6f} {fy:.6f} {fz:.6f}")

        content = "\n".join(lines)
        return Response(
            content=content,
            media_type="chemical/x-cif",
            headers={"Content-Disposition": f"attachment; filename={mat.formula}.cif"},
        )

    if fmt == "poscar":
        lines = [
            mat.formula,
            "1.0",
        ]
        if matrix:
            for row in matrix:
                lines.append(f"  {row[0]:12.8f}  {row[1]:12.8f}  {row[2]:12.8f}")
        else:
            import math
            ar, br, gr = math.radians(alpha), math.radians(beta), math.radians(gamma)
            cos_a, cos_b, cos_g, sin_g = math.cos(ar), math.cos(br), math.cos(gr), math.sin(gr)
            lines.append(f"  {a:12.8f}  {0:12.8f}  {0:12.8f}")
            lines.append(f"  {b*cos_g:12.8f}  {b*sin_g:12.8f}  {0:12.8f}")
            cx = c * cos_b
            cy = c * (cos_a - cos_b * cos_g) / sin_g
            cz = math.sqrt(max(0, c*c - cx*cx - cy*cy))
            lines.append(f"  {cx:12.8f}  {cy:12.8f}  {cz:12.8f}")

        # Count elements
        from collections import Counter
        el_counts = Counter(atom.get("element", "X") for atom in atoms)
        lines.append("  ".join(el_counts.keys()))
        lines.append("  ".join(str(v) for v in el_counts.values()))
        lines.append("Direct")
        for atom in atoms:
            fx = atom.get("fx", atom.get("x", 0))
            fy = atom.get("fy", atom.get("y", 0))
            fz = atom.get("fz", atom.get("z", 0))
            lines.append(f"  {fx:.8f}  {fy:.8f}  {fz:.8f}")

        content = "\n".join(lines)
        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={mat.formula}.vasp"},
        )

    # XYZ
    lines = [str(len(atoms)), mat.formula]
    for atom in atoms:
        el = atom.get("element", "X")
        x = atom.get("x", 0)
        y = atom.get("y", 0)
        z = atom.get("z", 0)
        lines.append(f"{el}  {x:.6f}  {y:.6f}  {z:.6f}")

    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="chemical/x-xyz",
        headers={"Content-Disposition": f"attachment; filename={mat.formula}.xyz"},
    )


@router.get("/scatter")
def scatter_data(
    x_prop: str = Query(..., description="X-axis property (e.g. band_gap)"),
    y_prop: str = Query(..., description="Y-axis property (e.g. density)"),
    color_prop: Optional[str] = Query(None, description="Color-by property"),
    crystal_system: Optional[str] = None,
    source_db: Optional[str] = None,
    is_stable: Optional[bool] = None,
    limit: int = Query(5000, ge=1, le=50000),
    db: Session = Depends(get_db),
):
    """Get scatter plot data for any two properties. Returns [{x, y, color, formula, id}]."""
    allowed_props = {
        "band_gap", "formation_energy", "energy_above_hull", "density", "volume",
        "bulk_modulus", "shear_modulus", "young_modulus", "poisson_ratio",
        "total_magnetization", "dielectric_constant", "refractive_index",
        "thermal_conductivity", "seebeck_coefficient", "n_elements", "efermi",
    }
    if x_prop not in allowed_props or y_prop not in allowed_props:
        raise HTTPException(status_code=400, detail=f"Properties must be one of: {', '.join(sorted(allowed_props))}")

    x_col = getattr(IndexedMaterial, x_prop, None)
    y_col = getattr(IndexedMaterial, y_prop, None)
    if x_col is None or y_col is None:
        raise HTTPException(status_code=400, detail="Invalid property name")

    query = (
        db.query(
            IndexedMaterial.id,
            IndexedMaterial.formula,
            x_col.label("x"),
            y_col.label("y"),
        )
        .filter(x_col.isnot(None), y_col.isnot(None))
    )

    if crystal_system:
        query = query.filter(IndexedMaterial.crystal_system == crystal_system)
    if source_db:
        query = query.filter(IndexedMaterial.source_db == source_db)
    if is_stable is not None:
        query = query.filter(IndexedMaterial.is_stable == is_stable)

    if color_prop and color_prop in allowed_props:
        color_col = getattr(IndexedMaterial, color_prop)
        query = query.add_columns(color_col.label("color"))
    else:
        color_prop = None

    rows = query.limit(limit).all()

    data = []
    for row in rows:
        point = {"id": row.id, "formula": row.formula, "x": row.x, "y": row.y}
        if color_prop:
            point["color"] = row.color
        data.append(point)

    return {
        "x_prop": x_prop,
        "y_prop": y_prop,
        "color_prop": color_prop,
        "count": len(data),
        "data": data,
    }


@router.get("/{material_id}/similar", response_model=list[IndexedMaterialSummary])
def get_similar_materials(
    material_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Find structurally similar materials (same space group + similar properties)."""
    mat = material_service.get_by_id(db, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    query = db.query(IndexedMaterial).filter(IndexedMaterial.id != mat.id)

    # Same space group
    if mat.space_group:
        query = query.filter(IndexedMaterial.space_group == mat.space_group)

    # Similar band gap (within 20%)
    if mat.band_gap is not None:
        margin = max(0.2, abs(mat.band_gap) * 0.2)
        query = query.filter(
            IndexedMaterial.band_gap.between(mat.band_gap - margin, mat.band_gap + margin)
        )

    # Same number of elements
    if mat.n_elements:
        query = query.filter(IndexedMaterial.n_elements == mat.n_elements)

    return query.limit(limit).all()


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
