"""Lattice parameter utilities: extraction, validation, primitive ↔ conventional.

Materials databases return lattice data in various formats:
- pymatgen structure dict with 3x3 lattice matrix
- Direct a,b,c,alpha,beta,gamma params
- Primitive or conventional cell

This module normalizes all formats to conventional cell params.
"""

from __future__ import annotations

import math
from typing import Any


def extract_lattice_from_structure(structure: dict) -> dict[str, float] | None:
    """Extract a,b,c,alpha,beta,gamma from a pymatgen-style structure dict.

    MP v2 API returns structure as:
      {"lattice": {"matrix": [[ax,ay,az],[bx,by,bz],[cx,cy,cz]], ...}, ...}

    Or sometimes:
      {"lattice": {"a": .., "b": .., "c": .., "alpha": .., ...}}
    """
    if not structure or not isinstance(structure, dict):
        return None

    lattice = structure.get("lattice")
    if not lattice or not isinstance(lattice, dict):
        return None

    # Case 1: already has a,b,c,alpha,beta,gamma
    if "a" in lattice and "alpha" in lattice:
        return {
            "a": float(lattice["a"]),
            "b": float(lattice["b"]),
            "c": float(lattice["c"]),
            "alpha": float(lattice["alpha"]),
            "beta": float(lattice["beta"]),
            "gamma": float(lattice["gamma"]),
        }

    # Case 2: has matrix - compute params from lattice vectors
    matrix = lattice.get("matrix")
    if matrix and isinstance(matrix, list) and len(matrix) == 3:
        return _matrix_to_params(matrix)

    return None


def _matrix_to_params(matrix: list[list[float]]) -> dict[str, float]:
    """Convert 3x3 lattice matrix to a,b,c,alpha,beta,gamma."""
    va = matrix[0]
    vb = matrix[1]
    vc = matrix[2]

    a = math.sqrt(sum(x**2 for x in va))
    b = math.sqrt(sum(x**2 for x in vb))
    c = math.sqrt(sum(x**2 for x in vc))

    def _angle(v1: list[float], v2: list[float], len1: float, len2: float) -> float:
        dot = sum(x * y for x, y in zip(v1, v2))
        cos_angle = max(-1.0, min(1.0, dot / (len1 * len2)))
        return math.degrees(math.acos(cos_angle))

    alpha = _angle(vb, vc, b, c)  # angle between b and c
    beta = _angle(va, vc, a, c)   # angle between a and c
    gamma = _angle(va, vb, a, b)  # angle between a and b

    return {
        "a": round(a, 4),
        "b": round(b, 4),
        "c": round(c, 4),
        "alpha": round(alpha, 2),
        "beta": round(beta, 2),
        "gamma": round(gamma, 2),
    }


def extract_atoms_from_structure(structure: dict) -> list[dict] | None:
    """Extract atom list [{element, x, y, z}] from pymatgen structure dict."""
    if not structure or not isinstance(structure, dict):
        return None

    sites = structure.get("sites")
    if not sites or not isinstance(sites, list):
        return None

    atoms = []
    for site in sites:
        species = site.get("species", [])
        element = ""
        if isinstance(species, list) and species:
            el = species[0]
            element = el.get("element", "") if isinstance(el, dict) else str(el)
        elif site.get("label"):
            element = site["label"]

        xyz = site.get("xyz") or site.get("abc", [0, 0, 0])
        if element and len(xyz) >= 3:
            atoms.append({
                "element": element,
                "x": round(float(xyz[0]), 4),
                "y": round(float(xyz[1]), 4),
                "z": round(float(xyz[2]), 4),
            })

    return atoms if atoms else None


def _approx_eq(a: float, b: float, tol: float = 0.02) -> bool:
    """Check if two values are approximately equal (relative tolerance)."""
    if abs(a) < 1e-10 and abs(b) < 1e-10:
        return True
    return abs(a - b) / max(abs(a), abs(b)) < tol


def _angles_approx(angles: tuple[float, float, float], target: float, tol: float = 2.0) -> bool:
    """Check if all three angles are approximately equal to target (in degrees)."""
    return all(abs(a - target) < tol for a in angles)


def detect_cell_type(
    a: float, b: float, c: float,
    alpha: float, beta: float, gamma: float,
    crystal_system: str | None = None,
) -> str:
    """Detect whether lattice params represent a primitive or conventional cell.

    Returns: "primitive", "conventional", or "unknown"
    """
    if crystal_system is None:
        return "unknown"

    cs = crystal_system.lower()

    if cs == "cubic":
        if _approx_eq(a, b) and _approx_eq(b, c):
            if _angles_approx((alpha, beta, gamma), 90.0):
                return "conventional"
            if _angles_approx((alpha, beta, gamma), 60.0):
                return "primitive"  # FCC primitive
            if _angles_approx((alpha, beta, gamma), 109.47, tol=3.0):
                return "primitive"  # BCC primitive
        return "unknown"

    if cs == "hexagonal" or cs == "trigonal":
        if abs(gamma - 120.0) < 3.0 and _angles_approx((alpha, beta), 90.0, tol=3.0):
            return "conventional"
        if _approx_eq(a, b) and _approx_eq(b, c) and _angles_approx((alpha, beta, gamma), 60.0, tol=5.0):
            return "primitive"  # rhombohedral primitive
        return "conventional"

    # For tetragonal, orthorhombic, etc. — angles should be ~90°
    if _angles_approx((alpha, beta, gamma), 90.0, tol=3.0):
        return "conventional"

    return "unknown"


def primitive_to_conventional(
    a: float, b: float, c: float,
    alpha: float, beta: float, gamma: float,
    crystal_system: str | None = None,
    space_group: str | None = None,
) -> dict[str, Any]:
    """Convert primitive cell to conventional cell parameters.

    Returns a dict with:
      - a, b, c, alpha, beta, gamma: conventional cell params
      - cell_type: "conventional"
      - primitive: original primitive params (if conversion was done)
      - converted: True if conversion was performed
    """
    cs = (crystal_system or "").lower()
    sg = space_group or ""

    result: dict[str, Any] = {
        "a": round(a, 4),
        "b": round(b, 4),
        "c": round(c, 4),
        "alpha": round(alpha, 2),
        "beta": round(beta, 2),
        "gamma": round(gamma, 2),
        "cell_type": "conventional",
        "converted": False,
    }

    cell_type = detect_cell_type(a, b, c, alpha, beta, gamma, crystal_system)

    if cell_type != "primitive":
        return result

    # Store original primitive params
    result["primitive"] = {
        "a": round(a, 4), "b": round(b, 4), "c": round(c, 4),
        "alpha": round(alpha, 2), "beta": round(beta, 2), "gamma": round(gamma, 2),
    }
    result["converted"] = True

    if cs == "cubic":
        avg_a = (a + b + c) / 3.0

        if _angles_approx((alpha, beta, gamma), 60.0):
            # FCC primitive → conventional: a_conv = a_prim × √2
            a_conv = avg_a * math.sqrt(2)
            result.update({"a": round(a_conv, 4), "b": round(a_conv, 4), "c": round(a_conv, 4)})
            result.update({"alpha": 90.0, "beta": 90.0, "gamma": 90.0})

        elif _angles_approx((alpha, beta, gamma), 109.47, tol=3.0):
            # BCC primitive → conventional: a_conv = a_prim × 2/√3
            a_conv = avg_a * 2.0 / math.sqrt(3)
            result.update({"a": round(a_conv, 4), "b": round(a_conv, 4), "c": round(a_conv, 4)})
            result.update({"alpha": 90.0, "beta": 90.0, "gamma": 90.0})

    elif cs in ("trigonal", "hexagonal"):
        if _approx_eq(a, b) and _approx_eq(b, c) and _angles_approx((alpha, beta, gamma), 60.0, tol=5.0):
            # Rhombohedral primitive → hexagonal conventional
            avg_a = (a + b + c) / 3.0
            avg_alpha = (alpha + beta + gamma) / 3.0
            alpha_rad = math.radians(avg_alpha)

            a_hex = avg_a * math.sqrt(2) * math.sqrt(1 - math.cos(alpha_rad))
            c_hex = avg_a * math.sqrt(3) * math.sqrt(1 + 2 * math.cos(alpha_rad))

            result.update({"a": round(a_hex, 4), "b": round(a_hex, 4), "c": round(c_hex, 4)})
            result.update({"alpha": 90.0, "beta": 90.0, "gamma": 120.0})

    return result


def normalize_lattice_for_display(
    lattice_params: dict | None,
    crystal_system: str | None = None,
    space_group: str | None = None,
) -> dict | None:
    """Normalize lattice parameters for display.

    If the params represent a primitive cell inconsistent with the labeled
    crystal system, converts to conventional and preserves the primitive
    cell as a sub-object.
    """
    if not lattice_params or not isinstance(lattice_params, dict):
        return lattice_params

    a = lattice_params.get("a")
    b = lattice_params.get("b")
    c = lattice_params.get("c")
    alpha = lattice_params.get("alpha", 90.0)
    beta = lattice_params.get("beta", 90.0)
    gamma = lattice_params.get("gamma", 90.0)

    if a is None or b is None or c is None:
        return lattice_params

    return primitive_to_conventional(
        float(a), float(b), float(c),
        float(alpha), float(beta), float(gamma),
        crystal_system=crystal_system,
        space_group=space_group,
    )
