"""Abstract base class for surrogate models."""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np


class SurrogateModel(ABC):
    """Approximates the true evaluator and provides uncertainty estimates."""

    @abstractmethod
    def train(self, X: np.ndarray, Y: np.ndarray) -> dict:
        """Train the model on data.

        X: shape (N, input_dim)
        Y: shape (N, output_dim)
        Returns: training metrics dict.
        """
        ...

    @abstractmethod
    def predict(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Predict with uncertainty.

        X: shape (N, input_dim)
        Returns: (Y_mean, Y_std) each of shape (N, output_dim).
        """
        ...

    @abstractmethod
    def accuracy(self) -> dict:
        """Return accuracy metrics from the last training run."""
        ...
