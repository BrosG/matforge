"""Active learning loop: sample -> train -> optimize -> validate."""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

from materia.active_learning.acquisition import AcquisitionFunction, MaxUncertainty
from materia.active_learning.convergence import ConvergenceCriterion, MaxRounds
from materia.analysis.pareto import compute_pareto_front
from materia.evaluate.base import Evaluator
from materia.material import Material
from materia.mdl import MaterialDef
from materia.optimize.base import Optimizer
from materia.surrogate.base import SurrogateModel
from materia.types import MaterialSource

logger = logging.getLogger(__name__)


@dataclass
class ActiveLearningConfig:
    """Configuration for the active learning loop."""

    initial_samples: int = 50
    samples_per_round: int = 10
    surrogate_evals: int = 100_000
    max_rounds: int = 15
    seed: int | None = None


@dataclass
class RoundResult:
    """Result of a single active learning round."""

    round_number: int
    new_materials: list[Material]
    pareto_front: list[Material]
    surrogate_accuracy: dict
    best_score: float
    total_evaluated: int


class ActiveLearningLoop:
    """Orchestrates the sample -> train -> optimize -> validate cycle."""

    def __init__(
        self,
        material_def: MaterialDef,
        evaluator: Evaluator,
        surrogate: SurrogateModel,
        optimizer: Optimizer,
        config: ActiveLearningConfig | None = None,
        acquisition: AcquisitionFunction | None = None,
        convergence: ConvergenceCriterion | None = None,
        on_round_complete: Callable[[RoundResult], None] | None = None,
    ) -> None:
        self.material_def = material_def
        self.evaluator = evaluator
        self.surrogate = surrogate
        self.optimizer = optimizer
        self.config = config or ActiveLearningConfig()
        self.acquisition = acquisition or MaxUncertainty()
        self.convergence = convergence or MaxRounds(self.config.max_rounds)
        self.on_round_complete = on_round_complete
        self._rng = np.random.default_rng(self.config.seed)

        self.dataset: list[Material] = []
        self.pareto_front: list[Material] = []
        self.history: list[RoundResult] = []

    def _latin_hypercube_sample(self, n: int) -> np.ndarray:
        """Generate n samples via Latin Hypercube Sampling in [0,1]^D."""
        d = self.material_def.input_dim
        result = np.zeros((n, d))
        for j in range(d):
            perm = self._rng.permutation(n)
            for i in range(n):
                result[perm[i], j] = (i + self._rng.uniform()) / n
        return result

    def _evaluate_batch(self, params_batch: np.ndarray) -> list[Material]:
        """Evaluate a batch of parameter vectors through the true evaluator."""
        materials = []
        for params in params_batch:
            material = self.evaluator.evaluate(params, self.material_def)
            material.metadata["material_def"] = self.material_def
            materials.append(material)
        return materials

    def _train_surrogate(self) -> dict:
        """Train surrogate model on the current dataset."""
        X = np.array([m.params for m in self.dataset])
        Y = np.array([m.objective_vector(self.material_def) for m in self.dataset])
        return self.surrogate.train(X, Y)

    def _optimize_on_surrogate(self, n_candidates: int) -> np.ndarray:
        """Run optimizer on the surrogate to find promising candidates."""

        def surrogate_objective(X: np.ndarray) -> np.ndarray:
            Y_mean, Y_std = self.surrogate.predict(X)
            return self.acquisition.score(Y_mean, Y_std, self.material_def)

        candidates = []
        evals_per_run = max(100, self.config.surrogate_evals // (n_candidates * 5))

        for _ in range(n_candidates * 5):
            self.optimizer.reset()
            best_x, best_f = self.optimizer.optimize(
                surrogate_objective, max_evals=evals_per_run
            )
            candidates.append((best_x, best_f))

        # Select top-n unique candidates by acquisition score
        candidates.sort(key=lambda c: c[1])

        selected: list[np.ndarray] = []
        for x, _ in candidates:
            # Skip if too close to existing selected candidates
            is_duplicate = False
            for s in selected:
                if np.linalg.norm(x - s) < 0.01:
                    is_duplicate = True
                    break
            if not is_duplicate:
                selected.append(x)
            if len(selected) >= n_candidates:
                break

        # Fill remaining slots with random if needed
        while len(selected) < n_candidates:
            selected.append(self._rng.uniform(0, 1, self.material_def.input_dim))

        return np.array(selected)

    def initialize(self) -> list[Material]:
        """Generate and evaluate initial samples via LHS."""
        logger.info(f"Generating {self.config.initial_samples} initial samples via LHS")
        initial_params = self._latin_hypercube_sample(self.config.initial_samples)
        initial_materials = self._evaluate_batch(initial_params)
        self.dataset.extend(initial_materials)
        self.pareto_front = compute_pareto_front(self.dataset, self.material_def)
        return initial_materials

    def run_round(self, round_number: int) -> RoundResult:
        """Run a single active learning round."""
        logger.info(f"=== Active Learning Round {round_number} ===")

        # Train surrogate
        accuracy = self._train_surrogate()
        logger.info(f"Surrogate trained: {accuracy}")

        # Optimize on surrogate
        candidates = self._optimize_on_surrogate(self.config.samples_per_round)

        # Evaluate candidates with true evaluator
        new_materials = self._evaluate_batch(candidates)
        for m in new_materials:
            m.source = MaterialSource.PHYSICS
        self.dataset.extend(new_materials)

        # Update Pareto front
        self.pareto_front = compute_pareto_front(self.dataset, self.material_def)

        # Compute best score
        best_score = float("inf")
        if self.pareto_front:
            best_score = min(m.score for m in self.pareto_front)

        result = RoundResult(
            round_number=round_number,
            new_materials=new_materials,
            pareto_front=list(self.pareto_front),
            surrogate_accuracy=accuracy,
            best_score=best_score,
            total_evaluated=len(self.dataset),
        )
        self.history.append(result)

        if self.on_round_complete:
            self.on_round_complete(result)

        return result

    def run(self) -> list[RoundResult]:
        """Run the full active learning loop until convergence."""
        self.initialize()

        round_num = 0
        while not self.convergence.should_stop(self.history):
            round_num += 1
            result = self.run_round(round_num)
            logger.info(
                f"Round {round_num}: {len(self.pareto_front)} Pareto solutions, "
                f"best_score={result.best_score:.6f}, total={result.total_evaluated}"
            )

        return self.history
