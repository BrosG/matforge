"""Campaign orchestrator - top-level entry point for materials discovery."""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Callable

import numpy as np

from materia.mdl import MaterialDef, parse_material_def
from materia.material import Material
from materia.evaluate.base import Evaluator
from materia.evaluate.analytic import AnalyticEvaluator
from materia.surrogate.base import SurrogateModel
from materia.surrogate.mlp import NumpyMLP, MLPConfig
from materia.optimize.base import Optimizer
from materia.optimize.cmaes import CMAES, CMAESConfig
from materia.active_learning.loop import (
    ActiveLearningLoop,
    ActiveLearningConfig,
    RoundResult,
)
from materia.active_learning.acquisition import (
    AcquisitionFunction,
    MaxUncertainty,
    ExpectedImprovement,
)
from materia.active_learning.convergence import MaxRounds
from materia.analysis.pareto import compute_pareto_front

logger = logging.getLogger(__name__)


@dataclass
class CampaignResult:
    """Complete results from a campaign run."""

    name: str
    total_rounds: int
    total_evaluated: int
    pareto_front: list[Material]
    all_materials: list[Material]
    history: list[RoundResult]
    wall_time_seconds: float


class Campaign:
    """Top-level orchestrator for a materials discovery campaign.

    Usage:
        campaign = Campaign.from_yaml("material.yaml")
        result = campaign.run(budget=500)
        campaign.export("results.csv")
    """

    def __init__(
        self,
        definition: MaterialDef,
        evaluator: Optional[Evaluator] = None,
        surrogate: Optional[SurrogateModel] = None,
        optimizer: Optional[Optimizer] = None,
    ) -> None:
        self.definition = definition
        self.evaluator = evaluator or self._default_evaluator()
        self.surrogate = surrogate or self._default_surrogate()
        self.optimizer = optimizer or self._default_optimizer()
        self.dataset: list[Material] = []
        self.pareto_front: list[Material] = []
        self.history: list[RoundResult] = []

    @classmethod
    def from_yaml(cls, path: str | Path) -> Campaign:
        """Create a Campaign from a YAML material definition file."""
        definition = parse_material_def(path)
        return cls(definition=definition)

    def _default_evaluator(self) -> Evaluator:
        return AnalyticEvaluator()

    def _default_surrogate(self) -> SurrogateModel:
        cfg = self.definition.surrogate_config
        arch = cfg.get("architecture", "mlp")

        if arch == "onnx":
            from materia.surrogate.onnx_surrogate import OnnxConfig, OnnxSurrogate

            onnx_config = OnnxConfig(
                model_path=cfg.get("model_path", ""),
                mc_samples=cfg.get("mc_samples", 10),
                use_gpu=cfg.get("use_gpu", False),
            )
            return OnnxSurrogate(
                input_dim=self.definition.input_dim,
                output_dim=self.definition.output_dim,
                config=onnx_config,
            )

        if arch == "chgnet":
            from materia.surrogate.chgnet_surrogate import ChgnetConfig, ChgnetSurrogate

            chgnet_config = ChgnetConfig(
                model_name=cfg.get("model_name", "0.3.0"),
                use_gpu=cfg.get("use_gpu", False),
            )
            return ChgnetSurrogate(
                input_dim=self.definition.input_dim,
                output_dim=self.definition.output_dim,
                config=chgnet_config,
            )

        if arch == "mace":
            from materia.surrogate.mace_surrogate import MaceConfig, MaceSurrogate

            mace_config = MaceConfig(
                model_name=cfg.get("model_name", "medium"),
                device="cuda" if cfg.get("use_gpu", False) else "cpu",
            )
            return MaceSurrogate(
                input_dim=self.definition.input_dim,
                output_dim=self.definition.output_dim,
                config=mace_config,
            )

        mlp_config = MLPConfig(
            hidden_layers=cfg.get("hidden_layers", [64, 64]),
            learning_rate=cfg.get("learning_rate", 1e-3),
            epochs=cfg.get("epochs", 200),
            mc_samples=cfg.get("mc_samples", 20),
            seed=cfg.get("seed"),
        )
        return NumpyMLP(
            input_dim=self.definition.input_dim,
            output_dim=self.definition.output_dim,
            config=mlp_config,
        )

    def _default_optimizer(self) -> Optimizer:
        cfg = self.definition.optimizer_config
        cmaes_config = CMAESConfig(
            sigma0=cfg.get("sigma0", 0.3),
            max_generations=cfg.get("max_generations", 200),
            seed=cfg.get("seed"),
        )
        return CMAES(dim=self.definition.input_dim, config=cmaes_config)

    def _get_acquisition(self) -> AcquisitionFunction:
        al_cfg = self.definition.active_learning_config
        strategy = al_cfg.get("acquisition", "max_uncertainty")
        if strategy == "expected_improvement":
            return ExpectedImprovement()
        return MaxUncertainty()

    def run(
        self,
        budget: int = 500,
        surrogate_evals: int = 5_000_000,
        rounds: int = 15,
        seed: Optional[int] = None,
    ) -> CampaignResult:
        """Run a full materials discovery campaign."""
        start_time = time.time()

        al_cfg = self.definition.active_learning_config
        initial_samples = al_cfg.get("initial_samples", min(50, budget // 5))
        # CLI --rounds takes precedence over YAML config
        max_rounds = min(rounds, al_cfg.get("max_rounds", rounds))
        samples_per_round = al_cfg.get(
            "samples_per_round", max(5, (budget - initial_samples) // max(1, max_rounds))
        )

        config = ActiveLearningConfig(
            initial_samples=initial_samples,
            samples_per_round=samples_per_round,
            surrogate_evals=surrogate_evals // max(1, max_rounds),
            max_rounds=max_rounds,
            seed=seed,
        )

        loop = ActiveLearningLoop(
            material_def=self.definition,
            evaluator=self.evaluator,
            surrogate=self.surrogate,
            optimizer=self.optimizer,
            config=config,
            acquisition=self._get_acquisition(),
            convergence=MaxRounds(max_rounds),
            on_round_complete=self._on_round_complete,
        )

        self.history = loop.run()
        self.dataset = loop.dataset
        self.pareto_front = loop.pareto_front

        wall_time = time.time() - start_time
        logger.info(
            f"Campaign complete in {wall_time:.1f}s: "
            f"{len(self.dataset)} evaluated, {len(self.pareto_front)} Pareto optimal"
        )

        return CampaignResult(
            name=self.definition.name,
            total_rounds=len(self.history),
            total_evaluated=len(self.dataset),
            pareto_front=self.pareto_front,
            all_materials=self.dataset,
            history=self.history,
            wall_time_seconds=wall_time,
        )

    def _on_round_complete(self, result: RoundResult) -> None:
        logger.info(
            f"[Round {result.round_number}] "
            f"Pareto: {len(result.pareto_front)}, "
            f"Total: {result.total_evaluated}, "
            f"Best: {result.best_score:.6f}"
        )

    def suggest(
        self, n: int = 10, strategy: str = "max_uncertainty"
    ) -> list[Material]:
        """Suggest the next n materials to test experimentally."""
        if not self.dataset:
            raise RuntimeError("No data available. Run a campaign first.")

        # Train surrogate on current data
        X = np.array([m.params for m in self.dataset])
        Y = np.array([m.objective_vector(self.definition) for m in self.dataset])
        self.surrogate.train(X, Y)

        # Generate candidates via LHS
        rng = np.random.default_rng()
        d = self.definition.input_dim
        n_candidates = n * 100
        candidates = rng.uniform(0, 1, (n_candidates, d))

        # Score them
        Y_mean, Y_std = self.surrogate.predict(candidates)

        if strategy == "max_uncertainty":
            scores = -Y_std.sum(axis=1)
        else:
            scores = Y_mean.mean(axis=1) - 2.0 * Y_std.mean(axis=1)

        # Select top-n
        top_indices = np.argsort(scores)[:n]
        suggestions = []
        for idx in top_indices:
            m = self.evaluator.evaluate(candidates[idx], self.definition)
            m.metadata["suggested"] = True
            suggestions.append(m)

        return suggestions

    def export(self, path: str, format: str = "csv") -> None:
        """Export results to file."""
        from materia.io.export import export_materials
        export_materials(
            materials=self.pareto_front if self.pareto_front else self.dataset,
            material_def=self.definition,
            path=path,
            fmt=format,
        )

    def save_state(self, path: str) -> None:
        """Save campaign state to JSON for later resumption."""
        state = {
            "name": self.definition.name,
            "total_evaluated": len(self.dataset),
            "pareto_size": len(self.pareto_front),
            "rounds_completed": len(self.history),
            "dataset": [
                {
                    "params": m.params.tolist(),
                    "properties": m.properties,
                    "score": m.score,
                    "source": m.source.value,
                }
                for m in self.dataset
            ],
        }
        Path(path).write_text(json.dumps(state, indent=2), encoding="utf-8")
