"""Pareto front computation using fast non-dominated sorting (NSGA-II)."""

from __future__ import annotations

import numpy as np

from materia.material import Material
from materia.mdl import MaterialDef
from materia.types import ObjectiveDirection


def _negate_for_maximization(
    objectives: np.ndarray, directions: list[ObjectiveDirection]
) -> np.ndarray:
    """Convert all objectives to minimization form."""
    result = objectives.copy()
    for i, d in enumerate(directions):
        if d == ObjectiveDirection.MAXIMIZE:
            result[:, i] *= -1
    return result


def is_dominated(a: np.ndarray, b: np.ndarray) -> bool:
    """Check if solution a is dominated by solution b (minimization form)."""
    return bool(np.all(b <= a) and np.any(b < a))


def fast_non_dominated_sort(objectives: np.ndarray) -> list[list[int]]:
    """Fast Non-Dominated Sort (NSGA-II).

    objectives: shape (N, M), all in minimization form.
    Returns: list of fronts, each front is a list of indices.
    """
    n = objectives.shape[0]
    if n == 0:
        return []

    domination_count = np.zeros(n, dtype=int)
    dominated_set: list[list[int]] = [[] for _ in range(n)]
    fronts: list[list[int]] = [[]]

    for i in range(n):
        for j in range(i + 1, n):
            if is_dominated(objectives[j], objectives[i]):
                dominated_set[i].append(j)
                domination_count[j] += 1
            elif is_dominated(objectives[i], objectives[j]):
                dominated_set[j].append(i)
                domination_count[i] += 1

        if domination_count[i] == 0:
            fronts[0].append(i)

    current_front = 0
    while fronts[current_front]:
        next_front: list[int] = []
        for i in fronts[current_front]:
            for j in dominated_set[i]:
                domination_count[j] -= 1
                if domination_count[j] == 0:
                    next_front.append(j)
        current_front += 1
        if next_front:
            fronts.append(next_front)
        else:
            break

    return fronts


def crowding_distance(objectives: np.ndarray, front_indices: list[int]) -> np.ndarray:
    """Compute crowding distance for solutions in a front."""
    n = len(front_indices)
    if n <= 2:
        return np.full(n, np.inf)

    obj_subset = objectives[front_indices]
    m = obj_subset.shape[1]
    distances = np.zeros(n)

    for col in range(m):
        order = np.argsort(obj_subset[:, col])
        distances[order[0]] = np.inf
        distances[order[-1]] = np.inf
        obj_range = obj_subset[order[-1], col] - obj_subset[order[0], col]
        if obj_range < 1e-12:
            continue
        for k in range(1, n - 1):
            distances[order[k]] += (
                obj_subset[order[k + 1], col] - obj_subset[order[k - 1], col]
            ) / obj_range

    return distances


def hypervolume_2d(objectives: np.ndarray, ref_point: np.ndarray) -> float:
    """Compute 2D hypervolume indicator (minimization form).

    objectives: shape (N, 2), non-dominated points.
    ref_point: shape (2,), reference point (must dominate all points).
    """
    if objectives.shape[0] == 0:
        return 0.0
    if objectives.shape[1] != 2:
        raise ValueError("hypervolume_2d requires exactly 2 objectives")

    # Sort by first objective
    sorted_idx = np.argsort(objectives[:, 0])
    sorted_obj = objectives[sorted_idx]

    hv = 0.0
    prev_y = ref_point[1]
    for i in range(sorted_obj.shape[0]):
        if sorted_obj[i, 0] < ref_point[0] and sorted_obj[i, 1] < ref_point[1]:
            hv += (ref_point[0] - sorted_obj[i, 0]) * (prev_y - sorted_obj[i, 1])
            prev_y = sorted_obj[i, 1]

    return float(hv)


def compute_pareto_front(
    materials: list[Material],
    material_def: MaterialDef,
) -> list[Material]:
    """Compute the Pareto front from a list of Materials.

    Updates the `dominated` flag on each Material and returns
    only the non-dominated materials.
    """
    if not materials:
        return []

    directions = [obj.direction for obj in material_def.objectives]
    obj_matrix = np.array([m.objective_vector(material_def) for m in materials])

    # Filter out materials with NaN properties
    valid_mask = ~np.any(np.isnan(obj_matrix), axis=1)
    valid_indices = np.where(valid_mask)[0]

    if len(valid_indices) == 0:
        return []

    valid_obj = obj_matrix[valid_indices]
    obj_min = _negate_for_maximization(valid_obj, directions)

    fronts = fast_non_dominated_sort(obj_min)
    if not fronts or not fronts[0]:
        return []

    pareto_set = set(valid_indices[i] for i in fronts[0])

    for i, m in enumerate(materials):
        m.dominated = i not in pareto_set

    return [materials[i] for i in sorted(pareto_set)]
