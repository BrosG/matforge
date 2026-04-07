"""Tests for CMA-ES optimizer."""

import numpy as np
from materia.optimize.cmaes import CMAES, CMAESConfig


def test_cmaes_sphere():
    """CMA-ES should minimize the sphere function near 0.5."""
    config = CMAESConfig(sigma0=0.3, max_generations=200, seed=42)
    cma = CMAES(dim=3, config=config)

    def sphere(X):
        # Minimum at [0.5, 0.5, 0.5] in [0,1]^D
        return ((X - 0.5) ** 2).sum(axis=1)

    best_x, best_f = cma.optimize(sphere, max_evals=5000)
    assert best_f < 0.01
    np.testing.assert_allclose(best_x, [0.5, 0.5, 0.5], atol=0.1)


def test_cmaes_ask_tell():
    """Test the ask/tell interface."""
    cma = CMAES(dim=2, config=CMAESConfig(seed=42))
    solutions = cma.ask()
    assert solutions.shape[1] == 2
    assert solutions.shape[0] == cma.lam
    assert np.all(solutions >= 0) and np.all(solutions <= 1)

    fitnesses = (solutions ** 2).sum(axis=1)
    cma.tell(solutions, fitnesses)
    assert cma.generation == 1


def test_cmaes_reset():
    cma = CMAES(dim=2, config=CMAESConfig(seed=42))
    cma.generation = 100
    cma.sigma = 0.001
    cma.reset()
    assert cma.generation == 0
    assert cma.sigma == 0.3


def test_cmaes_boundary_handling():
    """All solutions should be in [0,1]^D."""
    cma = CMAES(dim=5, config=CMAESConfig(sigma0=0.8, seed=42))
    for _ in range(10):
        solutions = cma.ask()
        assert np.all(solutions >= 0)
        assert np.all(solutions <= 1)
        fitnesses = np.random.default_rng(42).uniform(0, 1, solutions.shape[0])
        cma.tell(solutions, fitnesses)
