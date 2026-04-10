"""Tests for the safe expression evaluator."""

from __future__ import annotations

import numpy as np
import pytest

from materia.exceptions import MateriaEvalError
from materia.safe_eval import safe_eval, safe_exec


class TestSafeEval:
    """Test safe_eval with valid expressions."""

    def test_arithmetic(self):
        assert safe_eval("2 + 3") == 5
        assert safe_eval("10 - 4") == 6
        assert safe_eval("3 * 7") == 21
        assert safe_eval("15 / 3") == 5.0
        assert safe_eval("7 // 2") == 3
        assert safe_eval("7 % 3") == 1
        assert safe_eval("2 ** 10") == 1024

    def test_comparisons(self):
        assert safe_eval("3 > 2") is True
        assert safe_eval("3 < 2") is False
        assert safe_eval("3 >= 3") is True
        assert safe_eval("3 <= 2") is False
        assert safe_eval("3 == 3") is True
        assert safe_eval("3 != 2") is True

    def test_chained_comparison(self):
        assert safe_eval("1 < 2 < 3") is True
        assert safe_eval("1 < 2 > 3") is False

    def test_boolean_logic(self):
        assert safe_eval("True and True") is True
        assert safe_eval("True and False") is False
        assert safe_eval("True or False") is True
        assert safe_eval("not False") is True

    def test_variables(self):
        assert safe_eval("x + y", {"x": 3, "y": 4}) == 7
        assert safe_eval("x * 2 + 1", {"x": 5}) == 11

    def test_builtin_functions(self):
        assert safe_eval("abs(-5)") == 5
        assert safe_eval("max(1, 2, 3)") == 3
        assert safe_eval("min(1, 2, 3)") == 1
        assert safe_eval("round(3.14159, 2)") == 3.14

    def test_numpy_operations(self):
        result = safe_eval("np.sqrt(4.0)")
        assert result == pytest.approx(2.0)
        result = safe_eval("np.pi")
        assert result == pytest.approx(3.14159, rel=1e-4)

    def test_conditional_expression(self):
        assert safe_eval("x if x > 0 else -x", {"x": 5}) == 5
        assert safe_eval("x if x > 0 else -x", {"x": -5}) == 5

    def test_constraint_expression(self):
        """Simulate a real constraint from a material definition."""
        variables = {"pore_radius": 0.5, "membrane_thickness": 10.0}
        assert safe_eval("pore_radius > 0.1 and membrane_thickness < 100", variables) is True

    def test_physics_equation(self):
        """Simulate a real physics equation evaluation."""
        variables = {"pore_radius": 0.5e-9, "viscosity": 1e-3}
        result = safe_eval(
            "np.pi * pore_radius**4 / (8 * viscosity)",
            variables,
        )
        assert isinstance(result, float)
        assert result > 0


class TestSafeEvalBlocked:
    """Test that dangerous constructs are blocked."""

    def test_import_blocked(self):
        with pytest.raises(MateriaEvalError, match="Dunder access forbidden"):
            safe_eval("__import__('os')")

    def test_dunder_access_blocked(self):
        with pytest.raises(MateriaEvalError, match="Dunder access forbidden"):
            safe_eval("__builtins__")

    def test_private_attr_blocked(self):
        with pytest.raises(MateriaEvalError, match="Private attribute"):
            safe_eval("np._internal")

    def test_arbitrary_attr_blocked(self):
        with pytest.raises(MateriaEvalError):
            safe_eval("'hello'.join(['a'])")

    def test_large_exponent_blocked(self):
        with pytest.raises(MateriaEvalError, match="Exponent too large"):
            safe_eval("2 ** 1000")

    def test_undefined_variable(self):
        with pytest.raises(MateriaEvalError, match="Undefined variable"):
            safe_eval("undefined_var + 1")

    def test_disallowed_numpy_attr(self):
        with pytest.raises(MateriaEvalError, match="not in the allowlist"):
            safe_eval("np.loadtxt")

    def test_lambda_blocked(self):
        with pytest.raises(MateriaEvalError):
            safe_eval("(lambda x: x)(5)")

    def test_comprehension_blocked(self):
        with pytest.raises(MateriaEvalError):
            safe_eval("[x for x in range(10)]")


class TestSafeExec:
    """Test multi-line safe execution."""

    def test_simple_assignment(self):
        ns = safe_exec("a = 5")
        assert ns["a"] == 5

    def test_multi_line(self):
        code = """\
a = 3
b = 4
c = a + b
"""
        ns = safe_exec(code)
        assert ns["c"] == 7

    def test_with_initial_variables(self):
        code = "result = x ** 2 + y ** 2"
        ns = safe_exec(code, {"x": 3.0, "y": 4.0})
        assert ns["result"] == pytest.approx(25.0)

    def test_underscore_variable_blocked(self):
        with pytest.raises(MateriaEvalError, match="Variable names starting with '_'"):
            safe_exec("_secret = 42")

    def test_exec_then_eval(self):
        """Simulate multi-line equation evaluation pattern."""
        preamble = """\
viscosity = 1e-3
radius = pore_radius * 1e-9
"""
        ns = safe_exec(preamble, {"pore_radius": 0.5})
        result = safe_eval("np.pi * radius**4 / (8 * viscosity)", ns)
        assert isinstance(result, float)
        assert result > 0
