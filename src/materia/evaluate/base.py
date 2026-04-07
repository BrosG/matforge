"""Abstract base class for material property evaluators."""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from materia.material import Material
from materia.mdl import MaterialDef


class Evaluator(ABC):
    """Evaluates a parameter vector and returns a Material with properties."""

    @abstractmethod
    def evaluate(self, params: np.ndarray, material_def: MaterialDef) -> Material:
        """Evaluate a single parameter vector.

        params: shape (D,), values in [0,1]
        Returns: Material with properties populated.
        """
        ...

    def evaluate_batch(
        self, params_batch: np.ndarray, material_def: MaterialDef
    ) -> list[Material]:
        """Evaluate a batch of parameter vectors. Default: loop over evaluate()."""
        return [self.evaluate(params, material_def) for params in params_batch]
