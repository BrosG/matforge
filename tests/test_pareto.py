"""Tests for Pareto front computation."""

import numpy as np
from materia.analysis.pareto import (
    fast_non_dominated_sort,
    is_dominated,
    compute_pareto_front,
    crowding_distance,
)
from materia.material import Material
from materia.types import ObjectiveDirection
from materia.mdl import MaterialDef, ParameterDef, ObjectiveDef


def test_is_dominated():
    a = np.array([3.0, 4.0])
    b = np.array([2.0, 3.0])
    assert is_dominated(a, b) is True
    assert is_dominated(b, a) is False


def test_is_not_dominated_equal():
    a = np.array([2.0, 3.0])
    b = np.array([2.0, 3.0])
    assert is_dominated(a, b) is False


def test_fast_non_dominated_sort_simple():
    # 3 points: (1,3), (2,2), (3,1) are all on the Pareto front
    objectives = np.array([[1, 3], [2, 2], [3, 1]], dtype=float)
    fronts = fast_non_dominated_sort(objectives)
    assert len(fronts) == 1
    assert set(fronts[0]) == {0, 1, 2}


def test_fast_non_dominated_sort_with_dominated():
    objectives = np.array([
        [1, 3],  # Pareto
        [2, 2],  # Pareto
        [3, 4],  # Dominated by [2,2]
    ], dtype=float)
    fronts = fast_non_dominated_sort(objectives)
    assert set(fronts[0]) == {0, 1}
    assert 2 in fronts[1]


def test_compute_pareto_front(sample_materials, simple_material_def):
    front = compute_pareto_front(sample_materials, simple_material_def)
    assert len(front) > 0
    assert len(front) <= len(sample_materials)

    # All front members should be non-dominated
    for m in front:
        assert m.dominated is False

    # Non-front members should be dominated
    front_ids = {id(m) for m in front}
    for m in sample_materials:
        if id(m) not in front_ids:
            assert m.dominated is True


def test_pareto_front_no_domination():
    """No point in the Pareto front should be dominated by another."""
    mdef = MaterialDef(
        name="test", domain="test",
        parameters=[ParameterDef(name="x", range=(0, 1))],
        objectives=[
            ObjectiveDef(name="f1", direction=ObjectiveDirection.MINIMIZE),
            ObjectiveDef(name="f2", direction=ObjectiveDirection.MINIMIZE),
        ],
    )
    materials = [
        Material(params=np.array([0.1]), properties={"f1": 1.0, "f2": 5.0}),
        Material(params=np.array([0.5]), properties={"f1": 3.0, "f2": 3.0}),
        Material(params=np.array([0.9]), properties={"f1": 5.0, "f2": 1.0}),
        Material(params=np.array([0.4]), properties={"f1": 2.0, "f2": 2.0}),
    ]
    front = compute_pareto_front(materials, mdef)

    # (2,2) dominates nothing else on the front, but (1,5) and (5,1) are also non-dom
    # (2,2) dominates (3,3), but (3,3) is already there... let me check
    # Front should be: (1,5), (2,2), (5,1) -- (3,3) is dominated by (2,2)
    front_props = [(m.properties["f1"], m.properties["f2"]) for m in front]
    assert (3.0, 3.0) not in front_props
    assert (2.0, 2.0) in front_props


def test_crowding_distance():
    objectives = np.array([[1, 5], [2, 3], [3, 2], [5, 1]], dtype=float)
    indices = [0, 1, 2, 3]
    cd = crowding_distance(objectives, indices)
    assert cd[0] == np.inf  # Boundary
    assert cd[-1] == np.inf  # Boundary
    assert np.all(cd > 0)
