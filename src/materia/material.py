"""Material dataclass - the atomic unit of the design space."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

import numpy as np

from materia.types import MaterialSource

if TYPE_CHECKING:
    from materia.mdl import MaterialDef


@dataclass
class Material:
    """A single candidate material in the design space.

    params is a D-dimensional vector in [0,1]^D representing the normalized
    design parameters. composition maps component names to fractions.
    properties maps property names to measured/predicted scalar values.
    """

    params: np.ndarray
    composition: dict[str, float] = field(default_factory=dict)
    properties: dict[str, float] = field(default_factory=dict)
    score: float = 0.0
    source: MaterialSource = MaterialSource.INITIAL
    uncertainty: dict[str, float] = field(default_factory=dict)
    dominated: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)

    def recipe(self) -> dict[str, Any]:
        """Return a human-readable recipe decoding normalized params to physical values."""
        material_def: MaterialDef | None = self.metadata.get("material_def")
        if material_def is None:
            return {"params": self.params.tolist(), "composition": self.composition}

        recipe: dict[str, Any] = {}
        for i, param_def in enumerate(material_def.parameters):
            lo, hi = param_def.range
            physical_value = lo + self.params[i] * (hi - lo)
            recipe[param_def.name] = {
                "value": round(physical_value, 6),
                "unit": param_def.unit,
            }
        recipe["composition"] = self.composition
        return recipe

    def objective_vector(self, material_def: MaterialDef | None = None) -> np.ndarray:
        """Return property values as a numpy array ordered by material_def objectives."""
        mdef = material_def or self.metadata.get("material_def")
        if mdef is None:
            return np.array(list(self.properties.values()))
        return np.array(
            [self.properties.get(obj.name, np.nan) for obj in mdef.objectives]
        )

    def physical_values(
        self, material_def: MaterialDef | None = None
    ) -> dict[str, float]:
        """Decode normalized params to physical parameter values."""
        mdef = material_def or self.metadata.get("material_def")
        if mdef is None:
            return {}
        values = {}
        for i, p in enumerate(mdef.parameters):
            lo, hi = p.range
            values[p.name] = lo + self.params[i] * (hi - lo)
        return values

    def __repr__(self) -> str:
        props = ", ".join(f"{k}={v:.4f}" for k, v in self.properties.items())
        return f"Material(score={self.score:.4f}, {props}, source={self.source.value})"
