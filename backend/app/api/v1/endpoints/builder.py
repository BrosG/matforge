"""Structure builder and generator endpoints.

Provides tools for building crystal structures, nanoparticles,
surfaces, and MOFs programmatically.
"""

from __future__ import annotations

import json
import logging
import math
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from starlette.responses import Response

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request schemas ─────────────────────────────────────────────────────────

class SupercellRequest(BaseModel):
    mp_id: str
    nx: int = 2
    ny: int = 2
    nz: int = 2


class SurfaceRequest(BaseModel):
    mp_id: str
    miller_h: int = 1
    miller_k: int = 1
    miller_l: int = 0
    min_slab_size: float = 10.0  # Angstrom
    vacuum: float = 15.0  # Angstrom


class NanoparticleRequest(BaseModel):
    mp_id: str
    radius: float = 10.0  # Angstrom
    shape: str = "sphere"  # sphere, cube, wulff


class SubstitutionRequest(BaseModel):
    mp_id: str
    original_element: str
    substitute_element: str
    fraction: float = 1.0  # 0-1, fraction of sites to substitute


class InverseDesignRequest(BaseModel):
    target_band_gap: Optional[float] = None
    target_formation_energy: Optional[float] = None
    target_bulk_modulus: Optional[float] = None
    required_elements: list[str] = []
    excluded_elements: list[str] = []
    crystal_system: Optional[str] = None
    max_results: int = 20


# ── Helper ──────────────────────────────────────────────────────────────────

def _get_mp_structure(mp_id: str):
    """Fetch pymatgen Structure from MP."""
    import os

    try:
        from mp_api.client import MPRester
        api_key = os.environ.get("MATERIALS_PROJECT_API_KEY", "")
        with MPRester(api_key) as mpr:
            return mpr.get_structure_by_material_id(mp_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Cannot fetch structure for {mp_id}: {e}")


def _structure_to_response(structure, label: str = "") -> dict:
    """Convert pymatgen Structure to JSON response."""
    atoms = []
    for site in structure:
        atoms.append({
            "element": str(site.specie),
            "x": round(float(site.coords[0]), 4),
            "y": round(float(site.coords[1]), 4),
            "z": round(float(site.coords[2]), 4),
        })

    lattice = structure.lattice
    return {
        "label": label,
        "n_atoms": len(atoms),
        "atoms": atoms,
        "lattice": {
            "a": round(float(lattice.a), 4),
            "b": round(float(lattice.b), 4),
            "c": round(float(lattice.c), 4),
            "alpha": round(float(lattice.alpha), 2),
            "beta": round(float(lattice.beta), 2),
            "gamma": round(float(lattice.gamma), 2),
        },
        "lattice_matrix": [
            [round(float(v), 6) for v in row]
            for row in lattice.matrix.tolist()
        ],
        "formula": structure.composition.reduced_formula,
        "volume": round(float(structure.volume), 2),
    }


def _export_structure(structure, fmt: str, filename: str) -> Response:
    """Export pymatgen Structure as CIF, POSCAR, or XYZ."""
    if fmt == "cif":
        content = structure.to(fmt="cif")
        return Response(content=content, media_type="chemical/x-cif",
                        headers={"Content-Disposition": f"attachment; filename={filename}.cif"})
    elif fmt == "poscar":
        content = structure.to(fmt="poscar")
        return Response(content=content, media_type="text/plain",
                        headers={"Content-Disposition": f"attachment; filename={filename}.vasp"})
    else:
        content = structure.to(fmt="xyz")
        return Response(content=content, media_type="chemical/x-xyz",
                        headers={"Content-Disposition": f"attachment; filename={filename}.xyz"})


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/supercell")
def build_supercell(body: SupercellRequest):
    """Generate a supercell from a Materials Project structure."""
    structure = _get_mp_structure(body.mp_id)
    supercell = structure.copy()
    supercell.make_supercell([body.nx, body.ny, body.nz])
    return _structure_to_response(supercell, f"{body.nx}x{body.ny}x{body.nz} supercell of {body.mp_id}")


@router.post("/supercell/export")
def export_supercell(body: SupercellRequest, fmt: str = Query("poscar")):
    """Export supercell as CIF/POSCAR/XYZ."""
    structure = _get_mp_structure(body.mp_id)
    supercell = structure.copy()
    supercell.make_supercell([body.nx, body.ny, body.nz])
    return _export_structure(supercell, fmt, f"{body.mp_id}_supercell_{body.nx}{body.ny}{body.nz}")


@router.post("/surface")
def build_surface(body: SurfaceRequest):
    """Generate a surface slab from a bulk structure."""
    try:
        from pymatgen.core.surface import SlabGenerator

        structure = _get_mp_structure(body.mp_id)
        gen = SlabGenerator(
            structure,
            miller_index=(body.miller_h, body.miller_k, body.miller_l),
            min_slab_size=body.min_slab_size,
            min_vacuum_size=body.vacuum,
        )
        slabs = gen.get_slabs()
        if not slabs:
            raise HTTPException(status_code=404, detail="No valid slab found")

        slab = slabs[0]  # Take the most stable termination
        result = _structure_to_response(slab, f"({body.miller_h}{body.miller_k}{body.miller_l}) surface of {body.mp_id}")
        result["miller_index"] = [body.miller_h, body.miller_k, body.miller_l]
        result["vacuum"] = body.vacuum
        return result
    except ImportError:
        raise HTTPException(status_code=501, detail="pymatgen required for surface generation")


@router.post("/surface/export")
def export_surface(body: SurfaceRequest, fmt: str = Query("poscar")):
    """Export surface slab as CIF/POSCAR/XYZ."""
    from pymatgen.core.surface import SlabGenerator

    structure = _get_mp_structure(body.mp_id)
    gen = SlabGenerator(
        structure,
        miller_index=(body.miller_h, body.miller_k, body.miller_l),
        min_slab_size=body.min_slab_size,
        min_vacuum_size=body.vacuum,
    )
    slabs = gen.get_slabs()
    if not slabs:
        raise HTTPException(status_code=404, detail="No valid slab found")
    return _export_structure(slabs[0], fmt, f"{body.mp_id}_surface_{body.miller_h}{body.miller_k}{body.miller_l}")


@router.post("/nanoparticle")
def build_nanoparticle(body: NanoparticleRequest):
    """Carve a nanoparticle from a bulk structure."""
    structure = _get_mp_structure(body.mp_id)

    # Make a large supercell
    n_repeat = max(3, int(math.ceil(body.radius * 2 / min(structure.lattice.a, structure.lattice.b, structure.lattice.c))))
    supercell = structure.copy()
    supercell.make_supercell([n_repeat, n_repeat, n_repeat])

    # Carve sphere
    center = supercell.lattice.get_cartesian_coords([0.5, 0.5, 0.5])
    keep_indices = []
    for i, site in enumerate(supercell):
        dist = sum((a - b) ** 2 for a, b in zip(site.coords, center)) ** 0.5
        if dist <= body.radius:
            keep_indices.append(i)

    if not keep_indices:
        raise HTTPException(status_code=400, detail="Nanoparticle too small — no atoms within radius")

    # Build atom list
    atoms = []
    for i in keep_indices:
        site = supercell[i]
        atoms.append({
            "element": str(site.specie),
            "x": round(float(site.coords[0] - center[0]), 4),
            "y": round(float(site.coords[1] - center[1]), 4),
            "z": round(float(site.coords[2] - center[2]), 4),
        })

    return {
        "label": f"Nanoparticle from {body.mp_id} (r={body.radius} A)",
        "n_atoms": len(atoms),
        "atoms": atoms,
        "radius": body.radius,
        "formula": structure.composition.reduced_formula,
    }


@router.post("/substitute")
def build_substitution(body: SubstitutionRequest):
    """Substitute one element for another in a structure."""
    from pymatgen.transformations.standard_transformations import SubstitutionTransformation

    structure = _get_mp_structure(body.mp_id)

    if body.fraction >= 1.0:
        # Full substitution
        trans = SubstitutionTransformation({body.original_element: body.substitute_element})
        new_structure = trans.apply_transformation(structure)
    else:
        # Partial substitution
        trans = SubstitutionTransformation({
            body.original_element: {
                body.original_element: 1 - body.fraction,
                body.substitute_element: body.fraction,
            }
        })
        new_structure = trans.apply_transformation(structure)

    result = _structure_to_response(new_structure, f"{body.mp_id} with {body.original_element}->{body.substitute_element}")
    result["substitution"] = {
        "original": body.original_element,
        "substitute": body.substitute_element,
        "fraction": body.fraction,
    }
    return result


@router.post("/inverse_design")
def inverse_design(body: InverseDesignRequest):
    """AI inverse design: find materials matching target properties.

    Uses the existing database to find closest matches to target properties.
    For true generative design, would need a generative model (CDVAE/DiffCSP).
    """
    from app.db.base import get_db_context
    from app.db.models import IndexedMaterial
    from sqlalchemy import func

    with get_db_context() as db:
        query = db.query(IndexedMaterial)

        # Required elements
        for el in body.required_elements:
            query = query.filter(IndexedMaterial.formula.ilike(f"%{el}%"))

        # Excluded elements
        for el in body.excluded_elements:
            query = query.filter(~IndexedMaterial.formula.ilike(f"%{el}%"))

        # Crystal system
        if body.crystal_system:
            query = query.filter(IndexedMaterial.crystal_system == body.crystal_system)

        # Property filters (within 20% of target)
        if body.target_band_gap is not None:
            margin = max(0.3, abs(body.target_band_gap) * 0.2)
            query = query.filter(IndexedMaterial.band_gap.between(
                body.target_band_gap - margin, body.target_band_gap + margin
            ))

        if body.target_formation_energy is not None:
            margin = max(0.2, abs(body.target_formation_energy) * 0.2)
            query = query.filter(IndexedMaterial.formation_energy.between(
                body.target_formation_energy - margin, body.target_formation_energy + margin
            ))

        if body.target_bulk_modulus is not None:
            margin = max(20, abs(body.target_bulk_modulus) * 0.2)
            query = query.filter(IndexedMaterial.bulk_modulus.between(
                body.target_bulk_modulus - margin, body.target_bulk_modulus + margin
            ))

        # Only stable materials
        query = query.filter(IndexedMaterial.is_stable == True)

        results = query.limit(body.max_results).all()

        # Score each result by distance from targets
        candidates = []
        for mat in results:
            score = 0.0
            reasons = []
            if body.target_band_gap is not None and mat.band_gap is not None:
                diff = abs(mat.band_gap - body.target_band_gap)
                score += diff
                reasons.append(f"gap {mat.band_gap:.2f} eV (target {body.target_band_gap})")
            if body.target_formation_energy is not None and mat.formation_energy is not None:
                diff = abs(mat.formation_energy - body.target_formation_energy)
                score += diff
                reasons.append(f"Ef {mat.formation_energy:.3f} (target {body.target_formation_energy})")
            if body.target_bulk_modulus is not None and mat.bulk_modulus is not None:
                diff = abs(mat.bulk_modulus - body.target_bulk_modulus) / 100
                score += diff
                reasons.append(f"K {mat.bulk_modulus:.0f} GPa (target {body.target_bulk_modulus})")

            candidates.append({
                "id": mat.id,
                "external_id": mat.external_id,
                "formula": mat.formula,
                "band_gap": mat.band_gap,
                "formation_energy": mat.formation_energy,
                "energy_above_hull": mat.energy_above_hull,
                "bulk_modulus": mat.bulk_modulus,
                "crystal_system": mat.crystal_system,
                "space_group": mat.space_group,
                "score": round(score, 4),
                "reasons": reasons,
            })

        candidates.sort(key=lambda x: x["score"])
        return {
            "targets": {
                "band_gap": body.target_band_gap,
                "formation_energy": body.target_formation_energy,
                "bulk_modulus": body.target_bulk_modulus,
            },
            "filters": {
                "required_elements": body.required_elements,
                "excluded_elements": body.excluded_elements,
                "crystal_system": body.crystal_system,
            },
            "n_candidates": len(candidates),
            "candidates": candidates,
        }
