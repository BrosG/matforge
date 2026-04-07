"""MATERIA - Materials Discovery Engine.

Discover optimal materials through surrogate-assisted active learning
and multi-objective Pareto optimization.
"""

__version__ = "0.1.0"

from materia.material import Material
from materia.mdl import MaterialDef, parse_material_def
from materia.campaign import Campaign

__all__ = ["Material", "MaterialDef", "parse_material_def", "Campaign", "__version__"]
