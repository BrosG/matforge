"""Convergence plots for the active learning loop."""

from __future__ import annotations

from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from materia.active_learning.loop import RoundResult


def plot_convergence(
    history: list[RoundResult],
    save_path: Optional[str] = None,
    show: bool = True,
) -> None:
    """Plot convergence curves: best score, Pareto size, surrogate accuracy."""
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        raise ImportError(
            "matplotlib is required for plotting. Install with: pip install materia[viz]"
        )

    rounds = [h.round_number for h in history]
    best_scores = [h.best_score for h in history]
    pareto_sizes = [len(h.pareto_front) for h in history]
    total_evals = [h.total_evaluated for h in history]

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    # Best score over rounds
    axes[0].plot(rounds, best_scores, "b-o", markersize=4)
    axes[0].set_xlabel("Round")
    axes[0].set_ylabel("Best Score")
    axes[0].set_title("Best Score Convergence")
    axes[0].grid(True, alpha=0.3)

    # Pareto front size
    axes[1].plot(rounds, pareto_sizes, "g-o", markersize=4)
    axes[1].set_xlabel("Round")
    axes[1].set_ylabel("Pareto Front Size")
    axes[1].set_title("Pareto Front Growth")
    axes[1].grid(True, alpha=0.3)

    # Total evaluations
    axes[2].plot(rounds, total_evals, "r-o", markersize=4)
    axes[2].set_xlabel("Round")
    axes[2].set_ylabel("Total Evaluations")
    axes[2].set_title("Evaluation Budget Usage")
    axes[2].grid(True, alpha=0.3)

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150)
    if show:
        plt.show()
    plt.close()
