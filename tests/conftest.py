"""Shared fixtures for MATERIA tests."""

import pytest
import numpy as np
from pathlib import Path

from materia.types import ObjectiveDirection
from materia.mdl import MaterialDef, ParameterDef, ObjectiveDef
from materia.material import Material


@pytest.fixture
def rng():
    return np.random.default_rng(42)


@pytest.fixture
def simple_material_def():
    """A minimal 2-parameter, 2-objective material definition."""
    return MaterialDef(
        name="test_material",
        domain="test",
        parameters=[
            ParameterDef(name="x", range=(0.0, 10.0), unit="mm"),
            ParameterDef(name="y", range=(0.0, 10.0), unit="mm"),
        ],
        objectives=[
            ObjectiveDef(name="f1", direction=ObjectiveDirection.MINIMIZE),
            ObjectiveDef(name="f2", direction=ObjectiveDirection.MINIMIZE),
        ],
    )


@pytest.fixture
def water_yaml_path():
    return Path(__file__).parent / "fixtures" / "water_material.yaml"


@pytest.fixture
def sample_materials(rng, simple_material_def):
    """20 random materials with f1=x^2, f2=(1-x)^2 tradeoff."""
    materials = []
    for _ in range(20):
        params = rng.uniform(0, 1, 2)
        m = Material(
            params=params,
            properties={
                "f1": float(params[0] ** 2 + 0.1 * params[1]),
                "f2": float((1 - params[0]) ** 2 + 0.1 * params[1]),
            },
            metadata={"material_def": simple_material_def},
        )
        materials.append(m)
    return materials
