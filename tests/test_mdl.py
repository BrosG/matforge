"""Tests for MDL YAML parser."""

import pytest
from pathlib import Path

from materia.mdl import parse_material_def, MaterialDef
from materia.types import ObjectiveDirection
from materia.exceptions import MateriaConfigError


def test_parse_water_yaml(water_yaml_path):
    mdef = parse_material_def(water_yaml_path)
    assert mdef.name == "test_water_membrane"
    assert mdef.domain == "water"
    assert mdef.input_dim == 5
    assert mdef.output_dim == 3


def test_parse_parameters(water_yaml_path):
    mdef = parse_material_def(water_yaml_path)
    assert len(mdef.parameters) == 5
    p0 = mdef.parameters[0]
    assert p0.name == "pore_diameter"
    assert p0.range == (0.5, 5.0)
    assert p0.unit == "nm"


def test_parse_objectives(water_yaml_path):
    mdef = parse_material_def(water_yaml_path)
    assert len(mdef.objectives) == 3
    o0 = mdef.objectives[0]
    assert o0.name == "pfos_rejection"
    assert o0.direction == ObjectiveDirection.MAXIMIZE
    assert o0.weight == 1.0
    assert o0.equation == "water.pfos_rejection"


def test_parse_constraints(water_yaml_path):
    mdef = parse_material_def(water_yaml_path)
    assert len(mdef.constraints) == 1
    assert "pore_diameter" in mdef.constraints[0].expression


def test_parse_surrogate_config(water_yaml_path):
    mdef = parse_material_def(water_yaml_path)
    assert mdef.surrogate_config["hidden_layers"] == [32, 32]
    assert mdef.surrogate_config["epochs"] == 50


def test_parse_missing_file():
    with pytest.raises(MateriaConfigError, match="File not found"):
        parse_material_def("nonexistent.yaml")


def test_parse_invalid_yaml(tmp_path):
    bad_file = tmp_path / "bad.yaml"
    bad_file.write_text("name: test\n  broken: indent", encoding="utf-8")
    with pytest.raises(MateriaConfigError):
        parse_material_def(bad_file)


def test_parse_missing_name(tmp_path):
    no_name = tmp_path / "no_name.yaml"
    no_name.write_text("domain: test\n", encoding="utf-8")
    with pytest.raises(MateriaConfigError, match="Missing required field 'name'"):
        parse_material_def(no_name)
