"""Tests for Material dataclass."""

import numpy as np
from materia.material import Material
from materia.types import MaterialSource


def test_material_creation():
    params = np.array([0.5, 0.3, 0.8])
    m = Material(params=params, properties={"f1": 1.5, "f2": 2.0})
    assert m.params.shape == (3,)
    assert m.properties["f1"] == 1.5
    assert m.source == MaterialSource.INITIAL
    assert m.dominated is False


def test_material_recipe(simple_material_def):
    params = np.array([0.5, 0.7])
    m = Material(
        params=params,
        metadata={"material_def": simple_material_def},
    )
    recipe = m.recipe()
    assert "x" in recipe
    assert recipe["x"]["value"] == 5.0  # 0 + 0.5 * (10 - 0)
    assert recipe["y"]["value"] == 7.0  # 0 + 0.7 * (10 - 0)


def test_material_objective_vector(simple_material_def):
    params = np.array([0.5, 0.5])
    m = Material(
        params=params,
        properties={"f1": 1.0, "f2": 2.0},
        metadata={"material_def": simple_material_def},
    )
    vec = m.objective_vector(simple_material_def)
    np.testing.assert_array_equal(vec, [1.0, 2.0])


def test_material_physical_values(simple_material_def):
    params = np.array([0.0, 1.0])
    m = Material(params=params, metadata={"material_def": simple_material_def})
    phys = m.physical_values(simple_material_def)
    assert phys["x"] == 0.0
    assert phys["y"] == 10.0


def test_material_repr():
    m = Material(
        params=np.array([0.5]),
        properties={"f1": 1.234},
        score=0.5,
        source=MaterialSource.PHYSICS,
    )
    s = repr(m)
    assert "score=0.5000" in s
    assert "physics" in s
