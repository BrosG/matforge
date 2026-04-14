"""Import existing data into MATERIA format."""

from __future__ import annotations

import csv

import numpy as np

from materia.material import Material
from materia.mdl import MaterialDef
from materia.types import MaterialSource


def import_csv(
    path: str,
    material_def: MaterialDef,
    param_columns: list[str] | None = None,
    obj_columns: list[str] | None = None,
) -> list[Material]:
    """Import materials from a CSV file.

    Columns are matched to material_def parameters and objectives by name.
    Values are normalized to [0,1] based on the parameter ranges.
    """
    p_names = param_columns or [p.name for p in material_def.parameters]
    o_names = obj_columns or [o.name for o in material_def.objectives]

    materials: list[Material] = []

    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse and normalize parameters
            params = np.zeros(material_def.input_dim)
            for i, p_def in enumerate(material_def.parameters):
                col = p_names[i] if i < len(p_names) else p_def.name
                if col in row:
                    val = float(row[col])
                    lo, hi = p_def.range
                    params[i] = (val - lo) / (hi - lo) if hi > lo else 0.5
                    params[i] = np.clip(params[i], 0, 1)

            # Parse properties
            properties: dict[str, float] = {}
            for j, o_def in enumerate(material_def.objectives):
                col = o_names[j] if j < len(o_names) else o_def.name
                if col in row:
                    properties[o_def.name] = float(row[col])

            materials.append(
                Material(
                    params=params,
                    properties=properties,
                    source=MaterialSource.EXPERIMENT,
                    metadata={"material_def": material_def},
                )
            )

    return materials
