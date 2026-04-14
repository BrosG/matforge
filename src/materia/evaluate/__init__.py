from materia.evaluate.analytic import AnalyticEvaluator
from materia.evaluate.base import Evaluator

__all__ = ["AnalyticEvaluator", "Evaluator"]


def __getattr__(name: str):
    """Lazy import for DFT evaluators."""
    if name in ("VaspEvaluator", "QuantumEspressoEvaluator", "GpawEvaluator"):
        from materia.evaluate import dft

        return getattr(dft, name)
    if name in ("DFTEvaluator", "DFTConfig"):
        from materia.evaluate.dft import base_dft

        return getattr(base_dft, name)
    raise AttributeError(f"module 'materia.evaluate' has no attribute {name}")
