"""POSCAR (VASP input) writer."""

from __future__ import annotations

from pathlib import Path

from materia.material import Material
from materia.mdl import MaterialDef


_LATTICE_DEFAULTS = {"a": 5.0, "b": 5.0, "c": 5.0}


def material_to_poscar(
    material: Material,
    material_def: MaterialDef,
    title: str = "",
) -> str:
    """Convert a Material to POSCAR format string.

    POSCAR format:
      Line 1: comment
      Line 2: scaling factor
      Lines 3-5: lattice vectors (cubic by default, uses a/b/c if present)
      Line 6: element symbols
      Line 7: element counts
      Line 8: Direct (fractional coordinates)
      Lines 9+: atom positions
    """
    phys = material.physical_values(material_def)
    composition = material.composition or {}

    a = phys.get("a", _LATTICE_DEFAULTS["a"])
    b = phys.get("b", _LATTICE_DEFAULTS["b"])
    c = phys.get("c", _LATTICE_DEFAULTS["c"])

    comment = title or f"{material_def.name} score={material.score:.4f}"

    lines = [
        comment,
        "1.0",
        f"  {a:.6f}  0.000000  0.000000",
        f"  0.000000  {b:.6f}  0.000000",
        f"  0.000000  0.000000  {c:.6f}",
    ]

    if not composition:
        # Fallback: single dummy atom
        lines.append("X")
        lines.append("1")
        lines.append("Direct")
        lines.append("  0.000000  0.000000  0.000000")
        return "\n".join(lines)

    # Sort elements for deterministic output
    elements = sorted(composition.keys())

    # Convert fractions to integer counts (minimum 1 per element)
    total_atoms = max(len(elements), 1)
    counts = {}
    for elem in elements:
        frac = composition[elem]
        counts[elem] = max(1, round(frac * total_atoms * 4))

    lines.append("  ".join(elements))
    lines.append("  ".join(str(counts[e]) for e in elements))
    lines.append("Direct")

    # Place atoms at evenly spaced positions
    idx = 0
    for elem in elements:
        n = counts[elem]
        for j in range(n):
            fx = (idx + 0.5) / sum(counts.values())
            fy = 0.5 if n == 1 else j / max(n - 1, 1)
            fz = 0.5
            lines.append(f"  {fx:.6f}  {fy:.6f}  {fz:.6f}")
            idx += 1

    return "\n".join(lines)


def export_poscar(
    materials: list[Material],
    material_def: MaterialDef,
    path: str,
) -> None:
    """Export materials as individual POSCAR files in a directory.

    If path ends with a directory-like name, creates one POSCAR per material.
    Otherwise writes all as concatenated blocks to a single file.
    """
    p = Path(path)
    sorted_materials = sorted(materials, key=lambda m: m.score)

    if p.suffix:
        # Single file: concatenate with separator
        blocks = []
        for i, m in enumerate(sorted_materials):
            blocks.append(material_to_poscar(m, material_def, title=f"Material_{i+1}"))
        p.write_text("\n\n".join(blocks), encoding="utf-8")
    else:
        # Directory: one file per material
        p.mkdir(parents=True, exist_ok=True)
        for i, m in enumerate(sorted_materials):
            content = material_to_poscar(m, material_def, title=f"Material_{i+1}")
            (p / f"POSCAR_{i+1}").write_text(content, encoding="utf-8")
