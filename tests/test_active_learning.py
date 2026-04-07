"""Tests for the active learning loop."""

import numpy as np
from materia.active_learning.loop import ActiveLearningLoop, ActiveLearningConfig
from materia.active_learning.acquisition import MaxUncertainty, ExpectedImprovement
from materia.active_learning.convergence import MaxRounds, ParetoStabilized
from materia.evaluate.analytic import AnalyticEvaluator
from materia.surrogate.mlp import NumpyMLP, MLPConfig
from materia.optimize.cmaes import CMAES, CMAESConfig
from materia.mdl import parse_material_def


def test_active_learning_tiny_run(water_yaml_path):
    """Run a tiny 2-round campaign on the water plugin."""
    mdef = parse_material_def(water_yaml_path)

    evaluator = AnalyticEvaluator()
    surrogate = NumpyMLP(
        input_dim=mdef.input_dim,
        output_dim=mdef.output_dim,
        config=MLPConfig(hidden_layers=[16, 16], epochs=30, seed=42, mc_samples=5),
    )
    optimizer = CMAES(dim=mdef.input_dim, config=CMAESConfig(max_generations=20, seed=42))

    config = ActiveLearningConfig(
        initial_samples=15,
        samples_per_round=5,
        surrogate_evals=500,
        max_rounds=2,
        seed=42,
    )

    loop = ActiveLearningLoop(
        material_def=mdef,
        evaluator=evaluator,
        surrogate=surrogate,
        optimizer=optimizer,
        config=config,
        convergence=MaxRounds(2),
    )

    history = loop.run()
    assert len(history) == 2
    assert len(loop.dataset) == 15 + 2 * 5  # initial + 2 rounds * 5
    assert len(loop.pareto_front) > 0


def test_max_uncertainty_acquisition():
    Y_mean = np.array([[1.0, 2.0], [3.0, 4.0]])
    Y_std = np.array([[0.5, 0.5], [0.1, 0.1]])

    acq = MaxUncertainty()
    from materia.mdl import MaterialDef, ObjectiveDef
    from materia.types import ObjectiveDirection

    mdef = MaterialDef(
        name="t", domain="t",
        objectives=[
            ObjectiveDef(name="a", direction=ObjectiveDirection.MINIMIZE),
            ObjectiveDef(name="b", direction=ObjectiveDirection.MINIMIZE),
        ],
    )
    scores = acq.score(Y_mean, Y_std, mdef)
    assert scores.shape == (2,)
    # First point has higher uncertainty, so should have lower (better) score
    assert scores[0] < scores[1]


def test_max_rounds_convergence():
    conv = MaxRounds(5)
    assert conv.should_stop([]) is False
    assert conv.should_stop([None] * 5) is True  # type: ignore


def test_pareto_stabilized():
    from materia.active_learning.loop import RoundResult
    conv = ParetoStabilized(patience=2, max_rounds=100)

    # Create fake history with stable Pareto
    h1 = RoundResult(1, [], [None, None], {}, 1.0, 50)  # type: ignore
    h2 = RoundResult(2, [], [None, None], {}, 1.0, 60)  # type: ignore
    h3 = RoundResult(3, [], [None, None], {}, 1.0, 70)  # type: ignore

    assert conv.should_stop([h1]) is False
    assert conv.should_stop([h1, h2]) is False
    assert conv.should_stop([h1, h2, h3]) is True  # 2 rounds stable
