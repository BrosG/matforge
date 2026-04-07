"""Acquisition functions for active learning candidate selection."""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from materia.mdl import MaterialDef
from materia.types import ObjectiveDirection


class AcquisitionFunction(ABC):
    """Scores candidates for selection in the active learning loop."""

    @abstractmethod
    def score(
        self,
        Y_mean: np.ndarray,
        Y_std: np.ndarray,
        material_def: MaterialDef,
    ) -> np.ndarray:
        """Score candidates. Lower is better (for minimization by optimizer).

        Y_mean: shape (N, output_dim), predicted means.
        Y_std: shape (N, output_dim), predicted uncertainties.
        Returns: shape (N,) scalar acquisition scores.
        """
        ...


class MaxUncertainty(AcquisitionFunction):
    """Select candidates with highest total uncertainty.

    Encourages exploration of poorly-known regions.
    """

    def score(
        self,
        Y_mean: np.ndarray,
        Y_std: np.ndarray,
        material_def: MaterialDef,
    ) -> np.ndarray:
        # Negate because optimizer minimizes, but we want max uncertainty
        total_uncertainty = Y_std.sum(axis=1)
        return -total_uncertainty


class ExpectedImprovement(AcquisitionFunction):
    """Expected Improvement acquisition function.

    Balances exploitation (good predicted mean) with exploration (high uncertainty).
    Uses a weighted sum of objectives transformed to minimization form.
    """

    def __init__(self, xi: float = 0.01) -> None:
        self.xi = xi

    def score(
        self,
        Y_mean: np.ndarray,
        Y_std: np.ndarray,
        material_def: MaterialDef,
    ) -> np.ndarray:
        # Convert to minimization-form weighted scalar objective
        scores = np.zeros(Y_mean.shape[0])
        for j, obj in enumerate(material_def.objectives):
            if obj.direction == ObjectiveDirection.MAXIMIZE:
                scores -= obj.weight * Y_mean[:, j]
            else:
                scores += obj.weight * Y_mean[:, j]
        scores /= max(1, len(material_def.objectives))

        # EI: prefer low score with high uncertainty
        # Simple UCB-like formulation: score - xi * uncertainty
        total_std = Y_std.mean(axis=1)
        return scores - self.xi * total_std


class WeightedUCB(AcquisitionFunction):
    """Upper Confidence Bound with configurable exploration weight."""

    def __init__(self, kappa: float = 2.0) -> None:
        self.kappa = kappa

    def score(
        self,
        Y_mean: np.ndarray,
        Y_std: np.ndarray,
        material_def: MaterialDef,
    ) -> np.ndarray:
        scores = np.zeros(Y_mean.shape[0])
        for j, obj in enumerate(material_def.objectives):
            if obj.direction == ObjectiveDirection.MAXIMIZE:
                scores -= obj.weight * Y_mean[:, j]
            else:
                scores += obj.weight * Y_mean[:, j]
        scores /= max(1, len(material_def.objectives))

        total_std = Y_std.mean(axis=1)
        return scores - self.kappa * total_std
