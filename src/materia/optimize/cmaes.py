"""CMA-ES optimizer implemented from scratch in NumPy.

Covariance Matrix Adaptation Evolution Strategy following Hansen (2016).
Minimizes an objective function f: R^D -> R over [0,1]^D.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

from materia.optimize.base import Optimizer


@dataclass
class CMAESConfig:
    """Configuration for CMA-ES."""

    sigma0: float = 0.3
    max_generations: int = 1000
    tol_fun: float = 1e-12
    tol_x: float = 1e-12
    seed: int | None = None


class CMAES(Optimizer):
    """CMA-ES optimizer operating in [0,1]^D."""

    def __init__(self, dim: int, config: CMAESConfig | None = None) -> None:
        self.dim = dim
        self.config = config or CMAESConfig()
        self._rng = np.random.default_rng(self.config.seed)
        self._init_state()

    def _init_state(self) -> None:
        d = self.dim

        # Strategy parameters
        self.lam = 4 + int(3 * np.log(d)) if d > 1 else 6
        self.mu = self.lam // 2
        weights_raw = np.log(self.mu + 0.5) - np.log(np.arange(1, self.mu + 1))
        self.weights = weights_raw / weights_raw.sum()
        self.mu_eff = 1.0 / (self.weights**2).sum()

        # Adaptation rates
        self.c_sigma = (self.mu_eff + 2) / (d + self.mu_eff + 5)
        self.d_sigma = (
            1 + 2 * max(0, np.sqrt((self.mu_eff - 1) / (d + 1)) - 1) + self.c_sigma
        )
        self.c_c = (4 + self.mu_eff / d) / (d + 4 + 2 * self.mu_eff / d)
        self.c_1 = 2 / ((d + 1.3) ** 2 + self.mu_eff)
        self.c_mu = min(
            1 - self.c_1,
            2 * (self.mu_eff - 2 + 1 / self.mu_eff) / ((d + 2) ** 2 + self.mu_eff),
        )

        # State
        self.mean = self._rng.uniform(0.2, 0.8, d)
        self.sigma = self.config.sigma0
        self.C = np.eye(d)
        self.p_sigma = np.zeros(d)
        self.p_c = np.zeros(d)
        self.generation = 0
        self._chi_n = np.sqrt(d) * (1 - 1 / (4 * d) + 1 / (21 * d**2))

    def ask(self) -> np.ndarray:
        """Sample lambda candidate solutions in [0,1]^D."""
        eigenvalues, eigenvectors = np.linalg.eigh(self.C)
        eigenvalues = np.maximum(eigenvalues, 1e-20)
        D_sqrt = np.diag(np.sqrt(eigenvalues))
        B = eigenvectors

        samples = np.zeros((self.lam, self.dim))
        for i in range(self.lam):
            z = self._rng.standard_normal(self.dim)
            samples[i] = self.mean + self.sigma * (B @ D_sqrt @ z)

        # Boundary handling: reflect then clip
        samples = np.where(samples < 0, -samples, samples)
        samples = np.where(samples > 1, 2 - samples, samples)
        samples = np.clip(samples, 0, 1)
        return samples

    def tell(self, solutions: np.ndarray, fitnesses: np.ndarray) -> None:
        """Update CMA-ES state given solutions and their fitnesses."""
        order = np.argsort(fitnesses)
        selected = solutions[order[: self.mu]]

        old_mean = self.mean.copy()
        self.mean = self.weights @ selected

        # Eigendecomposition
        eigenvalues, eigenvectors = np.linalg.eigh(self.C)
        eigenvalues = np.maximum(eigenvalues, 1e-20)
        C_inv_sqrt = eigenvectors @ np.diag(1.0 / np.sqrt(eigenvalues)) @ eigenvectors.T

        displacement = (self.mean - old_mean) / self.sigma

        # Update sigma evolution path
        self.p_sigma = (1 - self.c_sigma) * self.p_sigma + np.sqrt(
            self.c_sigma * (2 - self.c_sigma) * self.mu_eff
        ) * (C_inv_sqrt @ displacement)

        # Update sigma
        self.sigma *= np.exp(
            (self.c_sigma / self.d_sigma)
            * (np.linalg.norm(self.p_sigma) / self._chi_n - 1)
        )
        self.sigma = min(self.sigma, 1.0)  # Cap sigma

        # Heaviside function
        h_sigma = (
            1.0
            if (
                np.linalg.norm(self.p_sigma)
                / np.sqrt(1 - (1 - self.c_sigma) ** (2 * (self.generation + 1)))
            )
            < (1.4 + 2 / (self.dim + 1)) * self._chi_n
            else 0.0
        )

        # Update C evolution path
        self.p_c = (1 - self.c_c) * self.p_c + h_sigma * np.sqrt(
            self.c_c * (2 - self.c_c) * self.mu_eff
        ) * displacement

        # Rank-one and rank-mu updates
        rank_one = np.outer(self.p_c, self.p_c)
        rank_mu = np.zeros_like(self.C)
        for i in range(self.mu):
            diff = (selected[i] - old_mean) / self.sigma
            rank_mu += self.weights[i] * np.outer(diff, diff)

        self.C = (
            (1 - self.c_1 - self.c_mu) * self.C
            + self.c_1 * rank_one
            + self.c_mu * rank_mu
        )
        self.C = (self.C + self.C.T) / 2  # Ensure symmetry

        self.generation += 1

    def converged(self) -> bool:
        """Check if CMA-ES has converged."""
        if self.generation >= self.config.max_generations:
            return True
        if self.sigma < self.config.tol_x:
            return True
        return False

    def optimize(
        self,
        objective_fn: Callable[[np.ndarray], np.ndarray],
        max_evals: int | None = None,
    ) -> tuple[np.ndarray, float]:
        """Run full CMA-ES optimization loop.

        objective_fn: takes (N, D) array, returns (N,) array of fitness values.
        Returns: (best_params, best_fitness).
        """
        max_evals = max_evals or self.config.max_generations * self.lam
        total_evals = 0
        best_x = self.mean.copy()
        best_f = float("inf")

        while total_evals < max_evals and not self.converged():
            solutions = self.ask()
            fitnesses = objective_fn(solutions)
            self.tell(solutions, fitnesses)

            gen_best_idx = int(np.argmin(fitnesses))
            if fitnesses[gen_best_idx] < best_f:
                best_f = float(fitnesses[gen_best_idx])
                best_x = solutions[gen_best_idx].copy()

            total_evals += self.lam

        return best_x, best_f

    def reset(self) -> None:
        """Reset optimizer to initial state."""
        self._init_state()
