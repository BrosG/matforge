"""Convergence criteria for the active learning loop."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from materia.active_learning.loop import RoundResult


class ConvergenceCriterion(ABC):
    """Determines when the active learning loop should stop."""

    @abstractmethod
    def should_stop(self, history: list[RoundResult]) -> bool:
        """Return True if the loop should stop."""
        ...


class MaxRounds(ConvergenceCriterion):
    """Stop after a maximum number of rounds."""

    def __init__(self, max_rounds: int = 15) -> None:
        self.max_rounds = max_rounds

    def should_stop(self, history: list[RoundResult]) -> bool:
        return len(history) >= self.max_rounds


class ParetoStabilized(ConvergenceCriterion):
    """Stop when the Pareto front has not changed for N consecutive rounds."""

    def __init__(self, patience: int = 3, max_rounds: int = 50) -> None:
        self.patience = patience
        self.max_rounds = max_rounds

    def should_stop(self, history: list[RoundResult]) -> bool:
        if len(history) >= self.max_rounds:
            return True
        if len(history) < self.patience + 1:
            return False

        # Check if Pareto front size has been stable
        recent_sizes = [len(h.pareto_front) for h in history[-self.patience:]]
        if len(set(recent_sizes)) == 1:
            # Also check if best score hasn't improved
            recent_scores = [h.best_score for h in history[-self.patience:]]
            improvement = abs(recent_scores[-1] - recent_scores[0])
            if improvement < 1e-6:
                return True

        return False
