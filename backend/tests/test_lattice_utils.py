"""Tests for lattice parameter primitive/conventional cell conversion."""

from __future__ import annotations

import math
import pytest

from app.services.lattice_utils import (
    detect_cell_type,
    normalize_lattice_for_display,
    primitive_to_conventional,
)


class TestDetectCellType:
    def test_cubic_conventional(self):
        assert detect_cell_type(5.43, 5.43, 5.43, 90, 90, 90, "cubic") == "conventional"

    def test_cubic_fcc_primitive(self):
        # FCC primitive: a=b=c, α=β=γ=60°
        assert detect_cell_type(3.84, 3.84, 3.84, 60, 60, 60, "cubic") == "primitive"

    def test_cubic_bcc_primitive(self):
        # BCC primitive: a=b=c, α=β=γ≈109.47°
        assert detect_cell_type(2.87, 2.87, 2.87, 109.5, 109.5, 109.5, "cubic") == "primitive"

    def test_hexagonal_conventional(self):
        assert detect_cell_type(3.19, 3.19, 5.19, 90, 90, 120, "hexagonal") == "conventional"

    def test_rhombohedral_primitive(self):
        assert detect_cell_type(5.45, 5.45, 5.45, 60, 60, 60, "trigonal") == "primitive"

    def test_no_crystal_system(self):
        assert detect_cell_type(5.0, 5.0, 5.0, 90, 90, 90) == "unknown"


class TestPrimitiveToConventional:
    def test_fcc_cubic(self):
        """FCC primitive (a≈3.84, α=60°) → conventional (a≈5.43, α=90°)."""
        result = primitive_to_conventional(
            3.84, 3.84, 3.84, 60, 60, 60, crystal_system="cubic"
        )
        assert result["converted"] is True
        assert result["alpha"] == 90.0
        assert result["beta"] == 90.0
        assert result["gamma"] == 90.0
        # a_conv = 3.84 × √2 ≈ 5.43
        assert abs(result["a"] - 5.43) < 0.05
        assert abs(result["b"] - result["a"]) < 0.001
        assert abs(result["c"] - result["a"]) < 0.001
        # Primitive cell preserved
        assert result["primitive"]["alpha"] == 60

    def test_already_conventional_cubic(self):
        """Already conventional cubic → no conversion."""
        result = primitive_to_conventional(
            5.43, 5.43, 5.43, 90, 90, 90, crystal_system="cubic"
        )
        assert result["converted"] is False
        assert result["a"] == 5.43

    def test_bcc_cubic(self):
        """BCC primitive → conventional."""
        result = primitive_to_conventional(
            2.87, 2.87, 2.87, 109.47, 109.47, 109.47, crystal_system="cubic"
        )
        assert result["converted"] is True
        assert result["alpha"] == 90.0
        # a_conv = 2.87 × 2/√3 ≈ 3.31
        assert result["a"] > 3.0

    def test_rhombohedral_to_hexagonal(self):
        """Rhombohedral primitive → hexagonal conventional."""
        result = primitive_to_conventional(
            5.45, 5.45, 5.45, 60, 60, 60, crystal_system="trigonal"
        )
        assert result["converted"] is True
        assert result["gamma"] == 120.0
        assert result["alpha"] == 90.0

    def test_realistic_ac2cdhg(self):
        """Simulate the Ac₂CdHg case: cubic Fm-3m with ~60° angles."""
        result = primitive_to_conventional(
            5.451, 5.458, 5.455, 59.95, 60.09, 60.04, crystal_system="cubic"
        )
        assert result["converted"] is True
        assert result["alpha"] == 90.0
        assert result["beta"] == 90.0
        assert result["gamma"] == 90.0
        # Conventional a should be ~7.71 Å (5.45 × √2)
        assert result["a"] > 7.5
        assert abs(result["a"] - result["b"]) < 0.05


class TestNormalizeLatticeForDisplay:
    def test_none_input(self):
        assert normalize_lattice_for_display(None) is None

    def test_empty_dict(self):
        assert normalize_lattice_for_display({}) == {}

    def test_conventional_passthrough(self):
        params = {"a": 5.43, "b": 5.43, "c": 5.43, "alpha": 90, "beta": 90, "gamma": 90}
        result = normalize_lattice_for_display(params, crystal_system="cubic")
        assert result["converted"] is False
        assert result["a"] == 5.43

    def test_primitive_converted(self):
        params = {"a": 3.84, "b": 3.84, "c": 3.84, "alpha": 60, "beta": 60, "gamma": 60}
        result = normalize_lattice_for_display(params, crystal_system="cubic")
        assert result["converted"] is True
        assert result["alpha"] == 90.0
        assert "primitive" in result
