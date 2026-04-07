from materia.evaluate.base import Evaluator
from materia.evaluate.analytic import AnalyticEvaluator

__all__ = ["Evaluator", "AnalyticEvaluator"]


def __getattr__(name: str):
    """Lazy import for DFT evaluators."""
    if name in ("VaspEvaluator", "QuantumEspressoEvaluator", "GpawEvaluator"):
        from materia.evaluate import dft

        return getattr(dft, name)
    if name in ("DFTEvaluator", "DFTConfig"):
        from materia.evaluate.dft import base_dft

        return getattr(base_dft, name)
    raise AttributeError(f"module 'materia.evaluate' has no attribute {name}")
