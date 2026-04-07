"""Material Definition Language (MDL) parser.

Parses YAML files into MaterialDef objects that describe the complete
materials design problem: parameters, objectives, constraints, and config.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import yaml

from materia.types import ObjectiveDirection
from materia.exceptions import MateriaConfigError


@dataclass
class ParameterDef:
    """Definition of a single design parameter."""

    name: str
    range: tuple[float, float]
    unit: str = ""
    type: str = "continuous"
    description: str = ""


@dataclass
class ObjectiveDef:
    """Definition of a single optimization objective."""

    name: str
    direction: ObjectiveDirection
    unit: str = ""
    weight: float = 1.0
    equation: Optional[str] = None
    description: str = ""


@dataclass
class ConstraintDef:
    """A constraint on the design space."""

    expression: str
    description: str = ""


@dataclass
class CompositionDef:
    """Definition of material composition constraints."""

    components: list[str]
    must_sum_to: float = 1.0


@dataclass
class MaterialDef:
    """Complete definition of a materials design problem, parsed from YAML."""

    name: str
    domain: str
    version: str = "1.0"
    description: str = ""
    parameters: list[ParameterDef] = field(default_factory=list)
    objectives: list[ObjectiveDef] = field(default_factory=list)
    constraints: list[ConstraintDef] = field(default_factory=list)
    composition: Optional[CompositionDef] = None
    surrogate_config: dict[str, Any] = field(default_factory=dict)
    optimizer_config: dict[str, Any] = field(default_factory=dict)
    active_learning_config: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def input_dim(self) -> int:
        return len(self.parameters)

    @property
    def output_dim(self) -> int:
        return len(self.objectives)


def parse_material_def(path: str | Path) -> MaterialDef:
    """Parse a YAML file into a MaterialDef.

    Raises MateriaConfigError on invalid input.
    """
    path = Path(path)
    if not path.exists():
        raise MateriaConfigError(f"File not found: {path}")

    try:
        with open(path, encoding="utf-8") as f:
            raw = yaml.safe_load(f)
    except yaml.YAMLError as e:
        raise MateriaConfigError(f"Invalid YAML in {path}: {e}") from e

    if not isinstance(raw, dict):
        raise MateriaConfigError(f"Expected YAML mapping at top level in {path}")

    # Validate required fields
    for field_name in ("name", "domain"):
        if field_name not in raw:
            raise MateriaConfigError(f"Missing required field '{field_name}' in {path}")

    # Parse parameters
    parameters = []
    for i, p in enumerate(raw.get("parameters", [])):
        if not isinstance(p, dict) or "name" not in p or "range" not in p:
            raise MateriaConfigError(
                f"Parameter {i} must have 'name' and 'range' fields"
            )
        r = p["range"]
        if not isinstance(r, (list, tuple)) or len(r) != 2:
            raise MateriaConfigError(
                f"Parameter '{p['name']}' range must be [low, high]"
            )
        parameters.append(ParameterDef(
            name=p["name"],
            range=(float(r[0]), float(r[1])),
            unit=p.get("unit", ""),
            type=p.get("type", "continuous"),
            description=p.get("description", ""),
        ))

    # Parse objectives
    objectives = []
    for i, o in enumerate(raw.get("objectives", [])):
        if not isinstance(o, dict) or "name" not in o or "direction" not in o:
            raise MateriaConfigError(
                f"Objective {i} must have 'name' and 'direction' fields"
            )
        try:
            direction = ObjectiveDirection(o["direction"])
        except ValueError:
            raise MateriaConfigError(
                f"Objective '{o['name']}' direction must be 'minimize' or 'maximize'"
            )
        objectives.append(ObjectiveDef(
            name=o["name"],
            direction=direction,
            unit=o.get("unit", ""),
            weight=float(o.get("weight", 1.0)),
            equation=o.get("equation"),
            description=o.get("description", ""),
        ))

    # Parse constraints
    constraints = []
    for i, c in enumerate(raw.get("constraints", [])):
        if not isinstance(c, dict) or "expression" not in c:
            raise MateriaConfigError(
                f"Constraint {i} must have an 'expression' field"
            )
        constraints.append(ConstraintDef(
            expression=c["expression"],
            description=c.get("description", ""),
        ))

    # Parse composition
    composition = None
    if "composition" in raw:
        comp = raw["composition"]
        if not isinstance(comp, dict) or "components" not in comp:
            raise MateriaConfigError("Composition must have 'components' list")
        composition = CompositionDef(
            components=comp["components"],
            must_sum_to=float(comp.get("must_sum_to", 1.0)),
        )

    return MaterialDef(
        name=raw["name"],
        domain=raw["domain"],
        version=raw.get("version", "1.0"),
        description=raw.get("description", ""),
        parameters=parameters,
        objectives=objectives,
        constraints=constraints,
        composition=composition,
        surrogate_config=raw.get("surrogate", {}),
        optimizer_config=raw.get("optimizer", {}),
        active_learning_config=raw.get("active_learning", {}),
        metadata=raw.get("metadata", {}),
    )
