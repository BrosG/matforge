"""Custom exceptions for MATERIA."""


class MateriaError(Exception):
    """Base exception for all MATERIA errors."""


class MateriaConfigError(MateriaError):
    """Raised when a material definition YAML is invalid."""


class MateriaEvalError(MateriaError):
    """Raised when a material evaluation fails."""


class MateriaConvergenceError(MateriaError):
    """Raised when an optimizer fails to converge."""
