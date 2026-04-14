"""CIF (Crystallographic Information File) writer."""

from __future__ import annotations

from pathlib import Path

from materia.material import Material
from materia.mdl import MaterialDef

# Standard lattice parameter names to look for in physical values
_LATTICE_PARAMS = {
    "a": 5.0,
    "b": 5.0,
    "c": 5.0,
    "alpha": 90.0,
    "beta": 90.0,
    "gamma": 90.0,
}


def material_to_cif(
    material: Material,
    material_def: MaterialDef,
    block_name: str = "matforge",
) -> str:
    """Convert a Material to a CIF format string.

    Maps composition to atom sites and params to lattice parameters
    where matching names exist. Uses cubic defaults otherwise.
    """
    phys = material.physical_values(material_def)

    # Extract lattice parameters from physical values or use defaults
    a = phys.get("a", _LATTICE_PARAMS["a"])
    b = phys.get("b", _LATTICE_PARAMS["b"])
    c = phys.get("c", _LATTICE_PARAMS["c"])
    alpha = phys.get("alpha", _LATTICE_PARAMS["alpha"])
    beta = phys.get("beta", _LATTICE_PARAMS["beta"])
    gamma = phys.get("gamma", _LATTICE_PARAMS["gamma"])

    lines = [
        f"data_{block_name}",
        f"_cell_length_a    {a:.4f}",
        f"_cell_length_b    {b:.4f}",
        f"_cell_length_c    {c:.4f}",
        f"_cell_angle_alpha {alpha:.4f}",
        f"_cell_angle_beta  {beta:.4f}",
        f"_cell_angle_gamma {gamma:.4f}",
        "_symmetry_space_group_name_H-M 'P 1'",
        "_symmetry_Int_Tables_number 1",
        "",
    ]

    # Build atom sites from composition
    composition = material.composition or {}
    if composition:
        lines.append("loop_")
        lines.append("_atom_site_label")
        lines.append("_atom_site_type_symbol")
        lines.append("_atom_site_fract_x")
        lines.append("_atom_site_fract_y")
        lines.append("_atom_site_fract_z")
        lines.append("_atom_site_occupancy")

        # Place atoms at evenly spaced fractional positions along x
        elements = sorted(composition.keys())
        n = len(elements)
        for i, elem in enumerate(elements):
            frac_x = (i + 0.5) / max(n, 1)
            occ = composition[elem]
            lines.append(
                f"{elem}{i + 1}  {elem}  {frac_x:.4f}  0.5000  0.5000  {occ:.4f}"
            )

    # Add properties as comments
    if material.properties:
        lines.append("")
        lines.append("# Properties")
        for k, v in material.properties.items():
            lines.append(f"# {k} = {v:.6f}")

    lines.append("")
    return "\n".join(lines)


def export_cif(
    materials: list[Material],
    material_def: MaterialDef,
    path: str,
) -> None:
    """Export a list of materials to a multi-block CIF file."""
    sorted_materials = sorted(materials, key=lambda m: m.score)
    blocks = []
    for i, m in enumerate(sorted_materials):
        block = material_to_cif(m, material_def, block_name=f"matforge_{i + 1}")
        blocks.append(block)

    Path(path).write_text("\n".join(blocks), encoding="utf-8")
