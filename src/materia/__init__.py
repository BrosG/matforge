"""MATERIA - Materials Discovery Engine.

Discover optimal materials through surrogate-assisted active learning
and multi-objective Pareto optimization.
"""

__version__ = "0.1.0"

from materia.campaign import Campaign
from materia.material import Material
from materia.mdl import MaterialDef, parse_material_def

__all__ = ["Campaign", "Material", "MaterialDef", "__version__", "parse_material_def"]
