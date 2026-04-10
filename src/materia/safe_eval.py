"""Safe expression evaluator using AST whitelisting.

Replaces raw eval()/exec() with a restricted evaluator that only permits
arithmetic, comparisons, boolean logic, attribute access on numpy, and
calls to an explicit allowlist of functions. No imports, no assignments
to arbitrary names, no dunder access, no lambda, no comprehensions.
"""

from __future__ import annotations

import ast
import math
import operator
from typing import Any

import numpy as np

from materia.exceptions import MateriaEvalError

# ---------------------------------------------------------------------------
# Allowed callables - the ONLY functions users may invoke in expressions
# ---------------------------------------------------------------------------
_SAFE_CALLABLES: dict[str, Any] = {
    "abs": abs,
    "max": max,
    "min": min,
    "round": round,
    "sum": sum,
    "len": len,
    "float": float,
    "int": int,
    # math
    "sqrt": math.sqrt,
    "exp": math.exp,
    "log": math.log,
    "log10": math.log10,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "pi": math.pi,
    "e": math.e,
    # numpy - exposed as the 'np' namespace
    "np": np,
}

# Operators permitted in expressions
_UNARY_OPS: dict[type, Any] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
    ast.Not: operator.not_,
}

_BIN_OPS: dict[type, Any] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}

_CMP_OPS: dict[type, Any] = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
}

_BOOL_OPS: dict[type, Any] = {
    ast.And: all,
    ast.Or: any,
}

# Attributes allowed on the 'np' namespace (numpy)
_NUMPY_ATTR_ALLOWLIST: frozenset[str] = frozenset({
    "sqrt", "exp", "log", "log10", "log2",
    "sin", "cos", "tan", "arcsin", "arccos", "arctan", "arctan2",
    "abs", "fabs", "floor", "ceil", "round",
    "maximum", "minimum", "clip",
    "mean", "sum", "std", "var",
    "pi", "e", "inf", "nan",
    "power", "square", "cbrt",
    "array", "zeros", "ones",
    "float64", "float32", "int64",
})


class _SafeEvaluator(ast.NodeVisitor):
    """Walk an AST tree and evaluate it safely."""

    def __init__(self, namespace: dict[str, Any]) -> None:
        self.namespace = namespace

    def evaluate(self, node: ast.AST) -> Any:
        return self.visit(node)

    def visit_Expression(self, node: ast.Expression) -> Any:
        return self.visit(node.body)

    def visit_Module(self, node: ast.Module) -> Any:
        result = None
        for stmt in node.body:
            result = self.visit(stmt)
        return result

    def visit_Expr(self, node: ast.Expr) -> Any:
        return self.visit(node.value)

    def visit_Assign(self, node: ast.Assign) -> Any:
        value = self.visit(node.value)
        for target in node.targets:
            if not isinstance(target, ast.Name):
                raise MateriaEvalError(
                    f"Only simple variable assignments allowed, got {type(target).__name__}"
                )
            name = target.id
            if name.startswith("_"):
                raise MateriaEvalError(
                    f"Variable names starting with '_' are forbidden: {name}"
                )
            self.namespace[name] = value
        return value

    def visit_Constant(self, node: ast.Constant) -> Any:
        if isinstance(node.value, (int, float, complex, bool, str, type(None))):
            return node.value
        raise MateriaEvalError(f"Unsupported constant type: {type(node.value).__name__}")

    def visit_Name(self, node: ast.Name) -> Any:
        name = node.id
        if name.startswith("__"):
            raise MateriaEvalError(f"Dunder access forbidden: {name}")
        if name in self.namespace:
            return self.namespace[name]
        if name in _SAFE_CALLABLES:
            return _SAFE_CALLABLES[name]
        raise MateriaEvalError(f"Undefined variable: '{name}'")

    def visit_Attribute(self, node: ast.Attribute) -> Any:
        value = self.visit(node.value)
        attr = node.attr
        if attr.startswith("_"):
            raise MateriaEvalError(f"Private attribute access forbidden: .{attr}")
        # Only allow attribute access on numpy
        if value is np:
            if attr not in _NUMPY_ATTR_ALLOWLIST:
                raise MateriaEvalError(f"numpy.{attr} is not in the allowlist")
            return getattr(np, attr)
        # Allow attribute access on numpy return values (e.g. array.shape)
        if isinstance(value, np.ndarray):
            if attr in ("shape", "dtype", "size", "ndim", "T"):
                return getattr(value, attr)
            raise MateriaEvalError(f"ndarray.{attr} is not allowed")
        raise MateriaEvalError(
            f"Attribute access only allowed on 'np' namespace, got {type(value).__name__}"
        )

    def visit_UnaryOp(self, node: ast.UnaryOp) -> Any:
        op = _UNARY_OPS.get(type(node.op))
        if op is None:
            raise MateriaEvalError(f"Unsupported unary operator: {type(node.op).__name__}")
        return op(self.visit(node.operand))

    def visit_BinOp(self, node: ast.BinOp) -> Any:
        op = _BIN_OPS.get(type(node.op))
        if op is None:
            raise MateriaEvalError(f"Unsupported binary operator: {type(node.op).__name__}")
        left = self.visit(node.left)
        right = self.visit(node.right)
        # Guard against exponent abuse
        if op is operator.pow:
            if isinstance(right, (int, float)) and abs(right) > 100:
                raise MateriaEvalError(f"Exponent too large: {right}")
        return op(left, right)

    def visit_BoolOp(self, node: ast.BoolOp) -> Any:
        reducer = _BOOL_OPS.get(type(node.op))
        if reducer is None:
            raise MateriaEvalError(f"Unsupported boolean operator: {type(node.op).__name__}")
        return reducer(self.visit(v) for v in node.values)

    def visit_Compare(self, node: ast.Compare) -> Any:
        left = self.visit(node.left)
        for op, comparator in zip(node.ops, node.comparators):
            cmp_fn = _CMP_OPS.get(type(op))
            if cmp_fn is None:
                raise MateriaEvalError(f"Unsupported comparison: {type(op).__name__}")
            right = self.visit(comparator)
            if not cmp_fn(left, right):
                return False
            left = right
        return True

    def visit_IfExp(self, node: ast.IfExp) -> Any:
        test = self.visit(node.test)
        return self.visit(node.body) if test else self.visit(node.orelse)

    def visit_Call(self, node: ast.Call) -> Any:
        func = self.visit(node.func)
        if not callable(func):
            raise MateriaEvalError(f"'{func}' is not callable")
        args = [self.visit(a) for a in node.args]
        kwargs = {kw.arg: self.visit(kw.value) for kw in node.keywords if kw.arg}
        return func(*args, **kwargs)

    def visit_Tuple(self, node: ast.Tuple) -> tuple:
        return tuple(self.visit(el) for el in node.elts)

    def visit_List(self, node: ast.List) -> list:
        return [self.visit(el) for el in node.elts]

    def generic_visit(self, node: ast.AST) -> Any:
        raise MateriaEvalError(
            f"Forbidden AST node: {type(node).__name__}. "
            f"Only arithmetic, comparisons, and whitelisted function calls are allowed."
        )


def safe_eval(expression: str, variables: dict[str, Any] | None = None) -> Any:
    """Evaluate a single expression safely.

    Only arithmetic, comparisons, boolean logic, and whitelisted function
    calls are permitted. No imports, no exec, no lambdas.

    Args:
        expression: A Python expression string.
        variables: Mapping of variable names to values.

    Returns:
        The result of the expression.

    Raises:
        MateriaEvalError: If the expression contains forbidden constructs.
    """
    namespace = dict(_SAFE_CALLABLES)
    if variables:
        namespace.update(variables)

    try:
        tree = ast.parse(expression.strip(), mode="eval")
    except SyntaxError as e:
        raise MateriaEvalError(f"Syntax error in expression: {e}") from e

    evaluator = _SafeEvaluator(namespace)
    return evaluator.evaluate(tree)


def safe_exec(code: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
    """Execute multi-line code safely and return the resulting namespace.

    Permits simple variable assignments and expressions. No imports,
    no function/class definitions, no dunder access.

    Args:
        code: Multi-line Python code.
        variables: Initial variable namespace.

    Returns:
        The namespace after execution (contains computed variables).

    Raises:
        MateriaEvalError: If the code contains forbidden constructs.
    """
    namespace = dict(_SAFE_CALLABLES)
    if variables:
        namespace.update(variables)

    try:
        tree = ast.parse(code.strip(), mode="exec")
    except SyntaxError as e:
        raise MateriaEvalError(f"Syntax error in code: {e}") from e

    evaluator = _SafeEvaluator(namespace)
    evaluator.evaluate(tree)
    return evaluator.namespace
