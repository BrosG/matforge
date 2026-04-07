"""Abstract base class for optimization algorithms."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable, Optional

import numpy as np


class Optimizer(ABC):
    """Optimizes an objective function over [0,1]^D using ask/tell interface."""

    @abstractmethod
    def ask(self) -> np.ndarray:
        """Generate candidate solutions. Returns: shape (population_size, D)."""
        ...

    @abstractmethod
    def tell(self, solutions: np.ndarray, fitnesses: np.ndarray) -> None:
        """Update state with evaluated solutions.

        solutions: shape (N, D)
        fitnesses: shape (N,), lower is better.
        """
        ...

    @abstractmethod
    def optimize(
        self,
        objective_fn: Callable[[np.ndarray], np.ndarray],
        max_evals: Optional[int] = None,
    ) -> tuple[np.ndarray, float]:
        """Run a complete optimization loop. Returns: (best_params, best_fitness)."""
        ...

    def reset(self) -> None:
        """Reset optimizer state for a fresh run."""
        pass
