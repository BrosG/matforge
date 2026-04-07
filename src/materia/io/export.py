"""Export materials data to CSV, JSON, and other formats."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from materia.material import Material
from materia.mdl import MaterialDef


def export_materials(
    materials: list[Material],
    material_def: MaterialDef,
    path: str,
    fmt: str = "csv",
) -> None:
    """Export materials to a file."""
    if fmt == "csv":
        _export_csv(materials, material_def, path)
    elif fmt == "json":
        _export_json(materials, material_def, path)
    elif fmt == "recipe":
        _export_recipes(materials, material_def, path)
    elif fmt == "cif":
        from materia.io.cif_writer import export_cif

        export_cif(materials, material_def, path)
    elif fmt == "poscar":
        from materia.io.poscar_writer import export_poscar

        export_poscar(materials, material_def, path)
    else:
        raise ValueError(f"Unknown export format: {fmt}")


def _export_csv(
    materials: list[Material], material_def: MaterialDef, path: str
) -> None:
    """Export to CSV with physical parameter values and properties."""
    param_names = [p.name for p in material_def.parameters]
    obj_names = [o.name for o in material_def.objectives]

    fieldnames = (
        ["rank", "score", "source"]
        + [f"param_{p}" for p in param_names]
        + [f"obj_{o}" for o in obj_names]
        + ["dominated"]
    )

    # Sort by score
    sorted_materials = sorted(materials, key=lambda m: m.score)

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for rank, m in enumerate(sorted_materials, 1):
            phys = m.physical_values(material_def)
            row = {
                "rank": rank,
                "score": round(m.score, 6),
                "source": m.source.value,
                "dominated": m.dominated,
            }
            for p in param_names:
                row[f"param_{p}"] = round(phys.get(p, 0.0), 6)
            for o in obj_names:
                row[f"obj_{o}"] = round(m.properties.get(o, 0.0), 6)
            writer.writerow(row)


def _export_json(
    materials: list[Material], material_def: MaterialDef, path: str
) -> None:
    """Export to JSON."""
    sorted_materials = sorted(materials, key=lambda m: m.score)
    data = {
        "material_name": material_def.name,
        "domain": material_def.domain,
        "n_materials": len(sorted_materials),
        "parameters": [p.name for p in material_def.parameters],
        "objectives": [o.name for o in material_def.objectives],
        "results": [],
    }

    for rank, m in enumerate(sorted_materials, 1):
        phys = m.physical_values(material_def)
        entry = {
            "rank": rank,
            "score": round(m.score, 6),
            "source": m.source.value,
            "dominated": m.dominated,
            "parameters": {k: round(v, 6) for k, v in phys.items()},
            "properties": {k: round(v, 6) for k, v in m.properties.items()},
        }
        data["results"].append(entry)

    Path(path).write_text(json.dumps(data, indent=2), encoding="utf-8")


def _export_recipes(
    materials: list[Material], material_def: MaterialDef, path: str
) -> None:
    """Export human-readable synthesis recipes."""
    sorted_materials = sorted(materials, key=lambda m: m.score)
    lines = [f"# Synthesis Recipes - {material_def.name}\n"]

    for rank, m in enumerate(sorted_materials, 1):
        recipe = m.recipe()
        lines.append(f"## Material #{rank} (score: {m.score:.4f})")
        lines.append("")
        for key, val in recipe.items():
            if key == "composition":
                if val:
                    lines.append(f"  Composition: {val}")
            elif isinstance(val, dict):
                lines.append(f"  {key}: {val['value']:.4f} {val.get('unit', '')}")
            else:
                lines.append(f"  {key}: {val}")
        lines.append(f"  Source: {m.source.value}")
        lines.append("")

    Path(path).write_text("\n".join(lines), encoding="utf-8")
