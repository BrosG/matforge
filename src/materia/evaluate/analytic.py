"""Analytic evaluator - evaluates materials using equations from the MaterialDef."""

from __future__ import annotations

import logging
from typing import Any

import numpy as np

from materia.evaluate.base import Evaluator
from materia.material import Material
from materia.mdl import MaterialDef
from materia.types import MaterialSource
from materia.exceptions import MateriaEvalError

logger = logging.getLogger(__name__)


class AnalyticEvaluator(Evaluator):
    """Evaluates materials using analytic equations defined in YAML or plugin physics.

    Equations can be:
    1. Plugin function references (e.g., "water.pfos_rejection")
    2. Inline Python expressions in the equation field
    """

    def __init__(self) -> None:
        self._plugin_functions: dict[str, Any] = {}
        self._plugins_loaded = False

    def _ensure_plugins_loaded(self) -> None:
        if self._plugins_loaded:
            return
        self._plugins_loaded = True
        try:
            from materia.plugins import discover_plugins, get_plugin_equations
            for domain in discover_plugins():
                eqs = get_plugin_equations(domain)
                self._plugin_functions.update(eqs)
        except Exception as e:
            logger.warning(f"Failed to load plugins: {e}")

    def evaluate(self, params: np.ndarray, material_def: MaterialDef) -> Material:
        """Evaluate a parameter vector using the material definition's equations."""
        self._ensure_plugins_loaded()

        # Decode normalized params to physical values
        physical_values: dict[str, float] = {}
        for i, p_def in enumerate(material_def.parameters):
            lo, hi = p_def.range
            physical_values[p_def.name] = lo + float(params[i]) * (hi - lo)

        # Check constraints
        for constraint in material_def.constraints:
            try:
                namespace = {"np": np, **physical_values}
                satisfied = eval(constraint.expression, {"__builtins__": {}}, namespace)
                if not satisfied:
                    # Return a heavily penalized material (finite values to avoid NaN in surrogate training)
                    properties = {obj.name: -1e6 if obj.direction.value == "maximize" else 1e6
                                  for obj in material_def.objectives}
                    return Material(
                        params=params.copy(),
                        properties=properties,
                        score=float("inf"),
                        source=MaterialSource.PHYSICS,
                        metadata={"material_def": material_def, "constraint_violated": constraint.description},
                    )
            except Exception:
                pass  # Skip constraint if evaluation fails

        # Evaluate each objective
        properties: dict[str, float] = {}
        for obj in material_def.objectives:
            try:
                value = self._evaluate_equation(obj.equation, physical_values)
            except Exception as e:
                raise MateriaEvalError(
                    f"Failed to evaluate objective '{obj.name}': {e}"
                ) from e
            properties[obj.name] = float(value)

        # Compute aggregate score (weighted sum, normalized by direction)
        score = 0.0
        for obj in material_def.objectives:
            val = properties[obj.name]
            if obj.direction.value == "maximize":
                score -= obj.weight * val  # Negate for minimization
            else:
                score += obj.weight * val
        score /= max(1, len(material_def.objectives))

        return Material(
            params=params.copy(),
            properties=properties,
            score=score,
            source=MaterialSource.PHYSICS,
            metadata={"material_def": material_def, "physical_values": physical_values},
        )

    def _evaluate_equation(
        self, equation: str | None, physical_values: dict[str, float]
    ) -> float:
        """Evaluate a single equation string."""
        if equation is None:
            return 0.0

        # Check if it's a plugin function reference
        if equation in self._plugin_functions:
            return self._plugin_functions[equation](**physical_values)

        # Otherwise treat as inline Python expression
        namespace: dict[str, Any] = {"np": np, "max": max, "min": min, "abs": abs}
        namespace.update(physical_values)

        # Handle multi-line equations (last expression is the result)
        lines = equation.strip().split("\n")
        lines = [l.strip() for l in lines if l.strip() and not l.strip().startswith("#")]

        if not lines:
            return 0.0

        # Execute all lines except the last as statements
        local_ns: dict[str, Any] = dict(namespace)
        for line in lines[:-1]:
            exec(line, {"__builtins__": {"max": max, "min": min, "abs": abs, "np": np}}, local_ns)

        # Evaluate the last line as an expression
        result = eval(
            lines[-1],
            {"__builtins__": {"max": max, "min": min, "abs": abs, "np": np}},
            local_ns,
        )
        return float(result)
