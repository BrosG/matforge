"""Pareto front scatter plots using matplotlib (optional dependency)."""

from __future__ import annotations

from materia.material import Material
from materia.mdl import MaterialDef


def plot_pareto_2d(
    materials: list[Material],
    material_def: MaterialDef,
    obj_x: int = 0,
    obj_y: int = 1,
    save_path: str | None = None,
    show: bool = True,
) -> None:
    """Plot 2D Pareto front scatter."""
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        raise ImportError(
            "matplotlib is required for plotting. Install with: pip install materia[viz]"
        )

    obj_x_name = material_def.objectives[obj_x].name
    obj_y_name = material_def.objectives[obj_y].name

    pareto = [m for m in materials if not m.dominated]
    dominated = [m for m in materials if m.dominated]

    fig, ax = plt.subplots(figsize=(10, 7))

    if dominated:
        ax.scatter(
            [m.properties.get(obj_x_name, 0) for m in dominated],
            [m.properties.get(obj_y_name, 0) for m in dominated],
            c="lightgray",
            alpha=0.5,
            s=20,
            label="Dominated",
        )

    if pareto:
        sc = ax.scatter(
            [m.properties.get(obj_x_name, 0) for m in pareto],
            [m.properties.get(obj_y_name, 0) for m in pareto],
            c="red",
            s=50,
            zorder=5,
            label="Pareto Front",
        )

        # Connect Pareto points with a line (sorted by x)
        pareto_sorted = sorted(pareto, key=lambda m: m.properties.get(obj_x_name, 0))
        ax.plot(
            [m.properties.get(obj_x_name, 0) for m in pareto_sorted],
            [m.properties.get(obj_y_name, 0) for m in pareto_sorted],
            "r--",
            alpha=0.5,
        )

    obj_x_def = material_def.objectives[obj_x]
    obj_y_def = material_def.objectives[obj_y]
    ax.set_xlabel(f"{obj_x_name} ({obj_x_def.unit})" if obj_x_def.unit else obj_x_name)
    ax.set_ylabel(f"{obj_y_name} ({obj_y_def.unit})" if obj_y_def.unit else obj_y_name)
    ax.set_title(f"Pareto Front - {material_def.name}")
    ax.legend()
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150)
    if show:
        plt.show()
    plt.close()
