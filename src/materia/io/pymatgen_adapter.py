"""Pymatgen structure adapter — convert between Material and pymatgen Structure."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

import numpy as np

from materia.material import Material
from materia.types import MaterialSource

if TYPE_CHECKING:
    from materia.mdl import MaterialDef

logger = logging.getLogger(__name__)

_PYMATGEN_MISSING = (
    "pymatgen is not installed. Install with: pip install pymatgen>=2024.1 "
    "or: pip install materia[pymatgen]"
)


def material_to_structure(material: Material):
    """Convert a Material to a pymatgen Structure.

    Uses material.composition for species and material.metadata for
    lattice parameters. Falls back to a cubic unit cell if no lattice
    information is available.

    Returns:
        pymatgen.core.Structure

    Raises:
        ImportError: if pymatgen is not installed
    """
    try:
        from pymatgen.core import Lattice, Structure
    except ImportError as e:
        raise ImportError(_PYMATGEN_MISSING) from e

    lattice_params = material.metadata.get("lattice", {})
    if lattice_params:
        a = lattice_params.get("a", 5.0)
        b = lattice_params.get("b", a)
        c = lattice_params.get("c", a)
        alpha = lattice_params.get("alpha", 90.0)
        beta = lattice_params.get("beta", 90.0)
        gamma = lattice_params.get("gamma", 90.0)
        lattice = Lattice.from_parameters(a, b, c, alpha, beta, gamma)
    else:
        lattice = Lattice.cubic(5.0)

    if not material.composition:
        return Structure(lattice, ["X"], [[0.0, 0.0, 0.0]])

    species = []
    coords = []
    total = sum(material.composition.values())

    for i, (elem, frac) in enumerate(material.composition.items()):
        count = max(1, round(frac / total * 4)) if total > 0 else 1
        for j in range(count):
            species.append(elem)
            x = (i * 0.25 + j * 0.1) % 1.0
            y = (i * 0.15 + j * 0.2) % 1.0
            z = (i * 0.1 + j * 0.3) % 1.0
            coords.append([x, y, z])

    return Structure(lattice, species, coords)


def structure_to_material(
    structure, material_def: MaterialDef | None = None
) -> Material:
    """Convert a pymatgen Structure to a Material.

    Args:
        structure: pymatgen.core.Structure
        material_def: optional MaterialDef for parameter mapping

    Returns:
        Material with composition extracted from structure
    """
    composition_raw = structure.composition.as_dict()
    total = sum(composition_raw.values())
    composition = (
        {k: v / total for k, v in composition_raw.items()} if total > 0 else {}
    )

    input_dim = material_def.input_dim if material_def else max(len(composition), 1)
    params = np.full(input_dim, 0.5)

    lattice = structure.lattice
    lattice_meta = {
        "a": lattice.a,
        "b": lattice.b,
        "c": lattice.c,
        "alpha": lattice.alpha,
        "beta": lattice.beta,
        "gamma": lattice.gamma,
        "volume": lattice.volume,
    }

    return Material(
        params=params,
        composition=composition,
        source=MaterialSource.EXPERIMENT,
        metadata={
            "lattice": lattice_meta,
            "space_group": structure.get_space_group_info()[0]
            if hasattr(structure, "get_space_group_info")
            else "",
            "num_sites": len(structure),
        },
    )


def read_structures(path: str | Path) -> list:
    """Read crystal structures from a file using pymatgen.

    Auto-detects format from extension: .cif, .poscar, .vasp, .json, etc.

    Args:
        path: path to structure file

    Returns:
        list of pymatgen.core.Structure objects

    Raises:
        ImportError: if pymatgen is not installed
    """
    try:
        from pymatgen.core import Structure
    except ImportError as e:
        raise ImportError(_PYMATGEN_MISSING) from e

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Structure file not found: {path}")

    suffix = path.suffix.lower()

    if suffix == ".json":
        import json

        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return [Structure.from_dict(d) for d in data]
        return [Structure.from_dict(data)]

    structure = Structure.from_file(str(path))
    return [structure]


def write_structures(
    structures: list,
    path: str | Path,
    fmt: str = "cif",
) -> None:
    """Write crystal structures to a file using pymatgen.

    Args:
        structures: list of pymatgen.core.Structure objects
        path: output file path
        fmt: format string — "cif", "poscar", "json", "cssr", "yaml"

    Raises:
        ImportError: if pymatgen is not installed
    """
    try:
        from pymatgen.core import Structure  # noqa: F401
    except ImportError as e:
        raise ImportError(_PYMATGEN_MISSING) from e

    path = Path(path)

    if fmt == "json":
        import json

        data = [s.as_dict() for s in structures]
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    elif len(structures) == 1:
        structures[0].to(fmt=fmt, filename=str(path))
    else:
        path.mkdir(parents=True, exist_ok=True)
        for i, structure in enumerate(structures):
            ext = "vasp" if fmt == "poscar" else fmt
            structure.to(fmt=fmt, filename=str(path / f"structure_{i:04d}.{ext}"))
