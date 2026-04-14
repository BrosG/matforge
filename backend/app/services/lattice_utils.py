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
    beta = _angle(va, vc, a, c)  # angle between a and c
    gamma = _angle(va, vb, a, b)  # angle between a and b

    return {
        "a": round(a, 4),
        "b": round(b, 4),
        "c": round(c, 4),
        "alpha": round(alpha, 2),
        "beta": round(beta, 2),
        "gamma": round(gamma, 2),
    }


def extract_lattice_matrix(structure: dict) -> list[list[float]] | None:
    """Extract the raw 3x3 lattice matrix from a pymatgen structure dict.

    The matrix defines the actual orientation of the primitive cell in the
    same Cartesian frame as the atom xyz coordinates. Essential for drawing
    a correctly-oriented unit cell box around primitive atoms.
    """
    if not structure or not isinstance(structure, dict):
        return None
    lattice = structure.get("lattice")
    if not lattice or not isinstance(lattice, dict):
        return None
    matrix = lattice.get("matrix")
    if matrix and isinstance(matrix, list) and len(matrix) == 3:
        return [[float(v) for v in row] for row in matrix]
    return None


def extract_atoms_from_structure(structure: dict) -> list[dict] | None:
    """Extract atom list [{element, x, y, z, fx, fy, fz}] from pymatgen structure dict.

    Returns atoms with BOTH Cartesian (x,y,z in Angstrom) and fractional (fx,fy,fz)
    coordinates. The frontend viewer uses Cartesian directly (no re-conversion needed).
    """
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

        # Prefer xyz (Cartesian Angstrom) — no conversion needed by frontend
        xyz = site.get("xyz")
        abc = site.get("abc")

        if element and xyz and len(xyz) >= 3:
            # Use abs(0.0) to avoid -0.0 serialization bug in JSON/React
            def _clean(v: float) -> float:
                r = round(float(v), 4)
                return 0.0 if r == 0.0 else r

            atom: dict = {
                "element": element,
                "x": _clean(xyz[0]),
                "y": _clean(xyz[1]),
                "z": _clean(xyz[2]),
                "cartesian": True,
            }
            if abc and len(abc) >= 3:
                atom["fx"] = _clean(abc[0])
                atom["fy"] = _clean(abc[1])
                atom["fz"] = _clean(abc[2])
            atoms.append(atom)
        elif element and abc and len(abc) >= 3:
            atoms.append(
                {
                    "element": element,
                    "x": round(float(abc[0]), 4),
                    "y": round(float(abc[1]), 4),
                    "z": round(float(abc[2]), 4),
                    "cartesian": False,  # These are fractional
                }
            )

    return atoms if atoms else None


def primitive_to_conventional_atoms(
    atoms: list[dict],
    lattice: dict,
    crystal_system: str | None = None,
    space_group: str | None = None,
) -> list[dict]:
    """Replicate primitive cell atoms to fill the conventional cell.

    For FCC (Fm-3m etc): 4 primitive atoms → 16 conventional atoms
    For BCC (Im-3m etc): 2 primitive atoms → 4 conventional atoms

    The atoms from MP are in PRIMITIVE cell fractional coordinates.
    The lattice we have is the CONVENTIONAL cell (after our conversion).
    We need to:
    1. Convert primitive fractional → primitive Cartesian (using primitive lattice)
    2. Apply centering translations in Cartesian
    3. Return Cartesian coordinates for the conventional cell
    """
    if not atoms or not crystal_system:
        return atoms

    sg = (space_group or "").strip()
    if not sg:
        return atoms

    centering = sg[0] if sg[0] in ("F", "I", "C", "A", "R") else "P"
    if centering == "P":
        return atoms  # No replication needed

    # Get conventional lattice parameters
    a_conv = float(lattice.get("a", 1))
    b_conv = float(lattice.get("b", 1))
    c_conv = float(lattice.get("c", 1))
    al_conv = float(lattice.get("alpha", 90))
    be_conv = float(lattice.get("beta", 90))
    ga_conv = float(lattice.get("gamma", 90))

    # Centering translation vectors in CONVENTIONAL fractional coordinates
    if centering == "F":
        translations = [(0, 0, 0), (0.5, 0.5, 0), (0.5, 0, 0.5), (0, 0.5, 0.5)]
    elif centering == "I":
        translations = [(0, 0, 0), (0.5, 0.5, 0.5)]
    elif centering == "C":
        translations = [(0, 0, 0), (0.5, 0.5, 0)]
    elif centering == "A":
        translations = [(0, 0, 0), (0, 0.5, 0.5)]
    elif centering == "R":
        translations = [(0, 0, 0), (2 / 3, 1 / 3, 1 / 3), (1 / 3, 2 / 3, 2 / 3)]
    else:
        return atoms

    # For each primitive atom, figure out its conventional fractional coords
    # Primitive abc coords → conventional fractional coords depends on centering
    # For FCC cubic: conv_frac = prim_frac (they share the same fractional positions
    # within the primitive cell, centering adds the translated copies)

    conv_atoms: list[dict] = []
    seen: set[tuple[str, int, int, int]] = set()

    for atom in atoms:
        # Get fractional coords (primitive cell basis)
        fx = atom.get("fx", atom.get("x", 0))
        fy = atom.get("fy", atom.get("y", 0))
        fz = atom.get("fz", atom.get("z", 0))

        for tx, ty, tz in translations:
            nfx = (fx + tx) % 1.0
            nfy = (fy + ty) % 1.0
            nfz = (fz + tz) % 1.0

            # Deduplicate with tolerance
            key = (
                atom["element"],
                round(nfx * 100),
                round(nfy * 100),
                round(nfz * 100),
            )
            if key in seen:
                continue
            seen.add(key)

            # Convert conventional fractional → Cartesian using conventional lattice
            cx, cy, cz = _frac_to_cart_simple(
                nfx, nfy, nfz, a_conv, b_conv, c_conv, al_conv, be_conv, ga_conv
            )

            conv_atoms.append(
                {
                    "element": atom["element"],
                    "x": round(cx, 4),
                    "y": round(cy, 4),
                    "z": round(cz, 4),
                    "cartesian": True,
                }
            )

    return conv_atoms


def _frac_to_cart_simple(
    fx: float,
    fy: float,
    fz: float,
    a: float,
    b: float,
    c: float,
    alpha: float,
    beta: float,
    gamma: float,
) -> tuple[float, float, float]:
    """Convert fractional to Cartesian coordinates."""
    ar = math.radians(alpha)
    br = math.radians(beta)
    gr = math.radians(gamma)

    cos_a, cos_b, cos_g = math.cos(ar), math.cos(br), math.cos(gr)
    sin_g = math.sin(gr)

    vax = a
    vbx = b * cos_g
    vby = b * sin_g
    vcx = c * cos_b
    vcy = c * (cos_a - cos_b * cos_g) / sin_g
    vcz = math.sqrt(max(0, c * c - vcx * vcx - vcy * vcy))

    x = fx * vax + fy * vbx + fz * vcx
    y = fy * vby + fz * vcy
    z = fz * vcz

    return (x, y, z)


def conventional_to_primitive_lattice(lattice: dict, space_group: str) -> dict:
    """Derive primitive lattice params from conventional cell + space group.

    MP returns atoms in primitive Cartesian coords. To draw the unit cell
    box around those atoms, we need the primitive lattice.

    FCC: a_prim = a_conv / √2, α=β=γ=60°
    BCC: a_prim = a_conv × √3/2, α=β=γ=109.47°
    """
    sg = space_group.strip() if space_group else ""
    centering = sg[0] if sg and sg[0] in ("F", "I", "C", "A", "R") else "P"

    a = float(lattice.get("a", 1))
    b = float(lattice.get("b", 1))
    c = float(lattice.get("c", 1))
    alpha = float(lattice.get("alpha", 90))
    beta = float(lattice.get("beta", 90))
    gamma = float(lattice.get("gamma", 90))

    if centering == "P":
        return {"a": a, "b": b, "c": c, "alpha": alpha, "beta": beta, "gamma": gamma}

    if centering == "F":
        # FCC: a_prim = a_conv / √2
        ap = round(a / math.sqrt(2), 4)
        return {"a": ap, "b": ap, "c": ap, "alpha": 60.0, "beta": 60.0, "gamma": 60.0}

    if centering == "I":
        # BCC: a_prim = a_conv × √3/2
        ap = round(a * math.sqrt(3) / 2, 4)
        return {
            "a": ap,
            "b": ap,
            "c": ap,
            "alpha": 109.47,
            "beta": 109.47,
            "gamma": 109.47,
        }

    if centering == "C":
        ap = round(math.sqrt(a**2 / 4 + b**2 / 4), 4)
        return {
            "a": ap,
            "b": ap,
            "c": c,
            "alpha": 90.0,
            "beta": 90.0,
            "gamma": round(2 * math.degrees(math.atan2(b, a)), 2),
        }

    if centering == "R":
        # Rhombohedral
        ap = round(math.sqrt(a**2 / 3 + c**2 / 9), 4)
        cos_alpha = (2 * c**2 / 9 - a**2 / 3) / (2 * (a**2 / 3 + c**2 / 9))
        al = round(math.degrees(math.acos(max(-1, min(1, cos_alpha)))), 2)
        return {"a": ap, "b": ap, "c": ap, "alpha": al, "beta": al, "gamma": al}

    return {"a": a, "b": b, "c": c, "alpha": alpha, "beta": beta, "gamma": gamma}


def _approx_eq(a: float, b: float, tol: float = 0.02) -> bool:
    """Check if two values are approximately equal (relative tolerance)."""
    if abs(a) < 1e-10 and abs(b) < 1e-10:
        return True
    return abs(a - b) / max(abs(a), abs(b)) < tol


def _angles_approx(
    angles: tuple[float, float, float], target: float, tol: float = 2.0
) -> bool:
    """Check if all three angles are approximately equal to target (in degrees)."""
    return all(abs(a - target) < tol for a in angles)


def _expected_angles(crystal_system: str) -> tuple[float, float, float] | None:
    """Return expected conventional cell angles for a crystal system."""
    cs = crystal_system.lower()
    if cs in ("cubic", "tetragonal", "orthorhombic"):
        return (90.0, 90.0, 90.0)
    if cs in ("hexagonal",):
        return (90.0, 90.0, 120.0)
    if cs in ("trigonal",):
        return (90.0, 90.0, 120.0)  # hexagonal setting
    if cs in ("monoclinic",):
        return None  # beta can vary, alpha=gamma=90
    if cs in ("triclinic",):
        return None  # all angles can vary
    return None


def _angles_match_system(
    alpha: float, beta: float, gamma: float, crystal_system: str
) -> bool:
    """Check if angles are consistent with the crystal system's conventional cell."""
    expected = _expected_angles(crystal_system)
    if expected is None:
        return True  # monoclinic/triclinic — any angles are valid

    tol = 2.0
    return all(abs(a - e) < tol for a, e in zip((alpha, beta, gamma), expected))


def primitive_to_conventional(
    a: float,
    b: float,
    c: float,
    alpha: float,
    beta: float,
    gamma: float,
    crystal_system: str | None = None,
    space_group: str | None = None,
) -> dict[str, Any]:
    """Convert primitive cell to conventional cell parameters.

    If angles are inconsistent with the crystal system, this is a primitive
    cell from the API. We force angles to the correct conventional values
    and note the conversion. The lattice lengths from the API are the
    primitive cell lengths — for cubic FCC we scale by √2, etc.

    For systems where we can't reliably convert (unknown Bravais lattice),
    we still correct the angles and flag a warning.
    """
    cs = (crystal_system or "").lower()

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

    # If no crystal system or monoclinic/triclinic, return as-is
    if not cs or cs in ("monoclinic", "triclinic"):
        return result

    # Detect primitive cell by lattice length inconsistency with crystal system
    # Tetragonal conventional: a=b≠c. If a=b=c, it's likely BCT primitive.
    tetragonal_as_cubic = cs == "tetragonal" and _approx_eq(a, b) and _approx_eq(b, c)
    # Orthorhombic conventional: a≠b≠c. If any two are equal, could be primitive centered.
    # (less reliable — skip for now)

    # Check if angles already match AND lengths are valid for the system
    if _angles_match_system(alpha, beta, gamma, cs) and not tetragonal_as_cubic:
        return result

    # Angles are wrong for this crystal system → primitive cell detected
    result["primitive"] = {
        "a": round(a, 4),
        "b": round(b, 4),
        "c": round(c, 4),
        "alpha": round(alpha, 2),
        "beta": round(beta, 2),
        "gamma": round(gamma, 2),
    }
    result["converted"] = True

    if cs == "cubic":
        avg_a = (a + b + c) / 3.0

        if _angles_approx((alpha, beta, gamma), 60.0):
            # FCC primitive → conventional: a_conv = a_prim × √2
            a_conv = avg_a * math.sqrt(2)
        elif _angles_approx((alpha, beta, gamma), 109.47, tol=3.0):
            # BCC primitive → conventional: a_conv = a_prim × 2/√3
            a_conv = avg_a * 2.0 / math.sqrt(3)
        else:
            # Unknown cubic primitive — approximate
            a_conv = avg_a * math.sqrt(2)

        result.update(
            {
                "a": round(a_conv, 4),
                "b": round(a_conv, 4),
                "c": round(a_conv, 4),
                "alpha": 90.0,
                "beta": 90.0,
                "gamma": 90.0,
            }
        )

    elif cs == "tetragonal":
        # Tetragonal: a=b, c different, all angles 90°
        # BCT primitive has a=b=c with non-90° angles
        # Conventional: a_conv from primitive vectors
        if _approx_eq(a, b):
            # a≈b already, just fix angles and scale c
            result.update({"a": round(a, 4), "b": round(a, 4), "c": round(c, 4)})
        else:
            # All similar lengths — BCT primitive
            # a_conv ≈ a_prim × √2, c_conv from geometry
            avg_ab = (a + b) / 2.0
            a_conv = avg_ab * math.sqrt(2)
            result.update(
                {"a": round(a_conv, 4), "b": round(a_conv, 4), "c": round(c, 4)}
            )
        result.update({"alpha": 90.0, "beta": 90.0, "gamma": 90.0})

    elif cs == "orthorhombic":
        # Orthorhombic: a≠b≠c, all angles 90°
        result.update({"alpha": 90.0, "beta": 90.0, "gamma": 90.0})

    elif cs in ("hexagonal", "trigonal"):
        if (
            _approx_eq(a, b)
            and _approx_eq(b, c)
            and _angles_approx((alpha, beta, gamma), 60.0, tol=10.0)
        ):
            # Rhombohedral primitive → hexagonal conventional
            avg_a = (a + b + c) / 3.0
            avg_alpha_rad = math.radians((alpha + beta + gamma) / 3.0)

            a_hex = avg_a * math.sqrt(2) * math.sqrt(1 - math.cos(avg_alpha_rad))
            c_hex = avg_a * math.sqrt(3) * math.sqrt(1 + 2 * math.cos(avg_alpha_rad))

            result.update(
                {
                    "a": round(a_hex, 4),
                    "b": round(a_hex, 4),
                    "c": round(c_hex, 4),
                    "alpha": 90.0,
                    "beta": 90.0,
                    "gamma": 120.0,
                }
            )
        else:
            # Force hexagonal angles
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
        float(a),
        float(b),
        float(c),
        float(alpha),
        float(beta),
        float(gamma),
        crystal_system=crystal_system,
        space_group=space_group,
    )
