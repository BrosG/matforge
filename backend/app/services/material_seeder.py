"""Seeder that generates realistic indexed material data for development.

Usage:
    from app.db.base import get_db_context
    from app.services.material_seeder import seed_materials

    with get_db_context() as db:
        seed_materials(db, count=1000)
"""

from __future__ import annotations

import hashlib
import logging
import math
import random
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import IndexedMaterial

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Realistic material templates
# ---------------------------------------------------------------------------

# (formula, elements, composition, crystal_system, space_group,
#  band_gap_range, formation_energy_range, density_range,
#  is_stable_prob, lattice_params, simple_structure)
#
# lattice_params: {"a": ..., "b": ..., "c": ..., "alpha": ..., "beta": ..., "gamma": ...}
# simple_structure: list of {"element": str, "x": float, "y": float, "z": float}

CRYSTAL_SYSTEMS = [
    "cubic", "hexagonal", "tetragonal", "orthorhombic",
    "monoclinic", "triclinic", "trigonal",
]

SPACE_GROUPS_BY_SYSTEM = {
    "cubic": ["Fm-3m", "Fd-3m", "Pm-3m", "Im-3m", "Pa-3", "F-43m", "I-43m"],
    "hexagonal": ["P6_3/mmc", "P6_3mc", "P-6m2", "P6/mmm", "P6_3/m"],
    "tetragonal": ["I4/mmm", "P4/mmm", "I4_1/amd", "P4_2/mnm", "I4/mcm"],
    "orthorhombic": ["Pnma", "Cmcm", "Pbca", "Pmmn", "Fmmm"],
    "monoclinic": ["C2/m", "P2_1/c", "C2/c", "P2_1/m", "Cm"],
    "triclinic": ["P-1", "P1"],
    "trigonal": ["R-3m", "R3m", "P-3m1", "R-3c", "R3c"],
}

SOURCE_DBS = ["materials_project", "aflow", "oqmd"]
SOURCE_WEIGHTS = [0.50, 0.30, 0.20]

# Each template: (formula, elements, composition, crystal_system,
#   band_gap_center, fe_center, density_center, is_stable_prob,
#   lattice_a, lattice_ratio_b, lattice_ratio_c, structure_sites)
MATERIAL_TEMPLATES = [
    # --- Simple elements ---
    ("Si", ["Si"], {"Si": 1.0}, "cubic",
     1.11, -0.53, 2.33, 0.95, 5.43, 1.0, 1.0,
     [{"el": "Si", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Si", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("Ge", ["Ge"], {"Ge": 1.0}, "cubic",
     0.66, -0.38, 5.32, 0.90, 5.66, 1.0, 1.0,
     [{"el": "Ge", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Ge", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("Fe", ["Fe"], {"Fe": 1.0}, "cubic",
     0.0, 0.0, 7.87, 0.99, 2.87, 1.0, 1.0,
     [{"el": "Fe", "x": 0.0, "y": 0.0, "z": 0.0}]),
    ("Cu", ["Cu"], {"Cu": 1.0}, "cubic",
     0.0, 0.0, 8.96, 0.99, 3.61, 1.0, 1.0,
     [{"el": "Cu", "x": 0.0, "y": 0.0, "z": 0.0}]),
    ("Al", ["Al"], {"Al": 1.0}, "cubic",
     0.0, 0.0, 2.70, 0.99, 4.05, 1.0, 1.0,
     [{"el": "Al", "x": 0.0, "y": 0.0, "z": 0.0}]),
    ("C", ["C"], {"C": 1.0}, "cubic",
     5.47, -0.17, 3.51, 0.95, 3.57, 1.0, 1.0,
     [{"el": "C", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "C", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("Ti", ["Ti"], {"Ti": 1.0}, "hexagonal",
     0.0, 0.0, 4.51, 0.99, 2.95, 1.0, 1.59,
     [{"el": "Ti", "x": 0.333, "y": 0.667, "z": 0.25}]),
    ("W", ["W"], {"W": 1.0}, "cubic",
     0.0, 0.0, 19.3, 0.99, 3.16, 1.0, 1.0,
     [{"el": "W", "x": 0.0, "y": 0.0, "z": 0.0}]),

    # --- Binary oxides ---
    ("TiO2", ["Ti", "O"], {"Ti": 0.333, "O": 0.667}, "tetragonal",
     3.03, -3.39, 4.23, 0.90, 4.59, 1.0, 0.644,
     [{"el": "Ti", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "O", "x": 0.305, "y": 0.305, "z": 0.0}]),
    ("Al2O3", ["Al", "O"], {"Al": 0.4, "O": 0.6}, "trigonal",
     8.80, -3.49, 3.99, 0.95, 4.76, 1.0, 2.73,
     [{"el": "Al", "x": 0.0, "y": 0.0, "z": 0.352}, {"el": "O", "x": 0.306, "y": 0.0, "z": 0.25}]),
    ("ZnO", ["Zn", "O"], {"Zn": 0.5, "O": 0.5}, "hexagonal",
     3.30, -1.63, 5.61, 0.92, 3.25, 1.0, 1.60,
     [{"el": "Zn", "x": 0.333, "y": 0.667, "z": 0.0}, {"el": "O", "x": 0.333, "y": 0.667, "z": 0.382}]),
    ("SiO2", ["Si", "O"], {"Si": 0.333, "O": 0.667}, "trigonal",
     8.90, -3.21, 2.65, 0.95, 4.91, 1.0, 1.10,
     [{"el": "Si", "x": 0.470, "y": 0.0, "z": 0.333}, {"el": "O", "x": 0.414, "y": 0.268, "z": 0.286}]),
    ("Fe2O3", ["Fe", "O"], {"Fe": 0.4, "O": 0.6}, "trigonal",
     2.20, -2.65, 5.24, 0.85, 5.04, 1.0, 2.73,
     [{"el": "Fe", "x": 0.0, "y": 0.0, "z": 0.355}, {"el": "O", "x": 0.306, "y": 0.0, "z": 0.25}]),
    ("MgO", ["Mg", "O"], {"Mg": 0.5, "O": 0.5}, "cubic",
     7.83, -3.08, 3.58, 0.98, 4.21, 1.0, 1.0,
     [{"el": "Mg", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "O", "x": 0.5, "y": 0.5, "z": 0.5}]),
    ("CeO2", ["Ce", "O"], {"Ce": 0.333, "O": 0.667}, "cubic",
     3.00, -3.75, 7.22, 0.90, 5.41, 1.0, 1.0,
     [{"el": "Ce", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "O", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("SnO2", ["Sn", "O"], {"Sn": 0.333, "O": 0.667}, "tetragonal",
     3.60, -2.04, 6.95, 0.88, 4.74, 1.0, 0.672,
     [{"el": "Sn", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "O", "x": 0.307, "y": 0.307, "z": 0.0}]),

    # --- Binary semiconductors ---
    ("GaAs", ["Ga", "As"], {"Ga": 0.5, "As": 0.5}, "cubic",
     1.42, -0.74, 5.32, 0.93, 5.65, 1.0, 1.0,
     [{"el": "Ga", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "As", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("GaN", ["Ga", "N"], {"Ga": 0.5, "N": 0.5}, "hexagonal",
     3.39, -1.11, 6.15, 0.90, 3.19, 1.0, 1.63,
     [{"el": "Ga", "x": 0.333, "y": 0.667, "z": 0.0}, {"el": "N", "x": 0.333, "y": 0.667, "z": 0.377}]),
    ("InP", ["In", "P"], {"In": 0.5, "P": 0.5}, "cubic",
     1.34, -0.49, 4.81, 0.90, 5.87, 1.0, 1.0,
     [{"el": "In", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "P", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("ZnS", ["Zn", "S"], {"Zn": 0.5, "S": 0.5}, "cubic",
     3.54, -1.04, 4.09, 0.88, 5.41, 1.0, 1.0,
     [{"el": "Zn", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "S", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("CdTe", ["Cd", "Te"], {"Cd": 0.5, "Te": 0.5}, "cubic",
     1.44, -0.41, 5.85, 0.85, 6.48, 1.0, 1.0,
     [{"el": "Cd", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Te", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("SiC", ["Si", "C"], {"Si": 0.5, "C": 0.5}, "cubic",
     2.36, -0.72, 3.21, 0.92, 4.36, 1.0, 1.0,
     [{"el": "Si", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "C", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("BN", ["B", "N"], {"B": 0.5, "N": 0.5}, "hexagonal",
     6.00, -1.32, 2.10, 0.90, 2.50, 1.0, 2.66,
     [{"el": "B", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "N", "x": 0.333, "y": 0.667, "z": 0.0}]),
    ("AlN", ["Al", "N"], {"Al": 0.5, "N": 0.5}, "hexagonal",
     6.01, -1.53, 3.26, 0.91, 3.11, 1.0, 1.60,
     [{"el": "Al", "x": 0.333, "y": 0.667, "z": 0.0}, {"el": "N", "x": 0.333, "y": 0.667, "z": 0.382}]),

    # --- Ternary oxides / perovskites ---
    ("BaTiO3", ["Ba", "Ti", "O"], {"Ba": 0.2, "Ti": 0.2, "O": 0.6}, "tetragonal",
     3.20, -3.51, 6.02, 0.88, 4.00, 1.0, 1.01,
     [{"el": "Ba", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Ti", "x": 0.5, "y": 0.5, "z": 0.5},
      {"el": "O", "x": 0.5, "y": 0.5, "z": 0.0}]),
    ("SrTiO3", ["Sr", "Ti", "O"], {"Sr": 0.2, "Ti": 0.2, "O": 0.6}, "cubic",
     3.25, -3.64, 5.12, 0.92, 3.91, 1.0, 1.0,
     [{"el": "Sr", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Ti", "x": 0.5, "y": 0.5, "z": 0.5},
      {"el": "O", "x": 0.5, "y": 0.5, "z": 0.0}]),
    ("LaAlO3", ["La", "Al", "O"], {"La": 0.2, "Al": 0.2, "O": 0.6}, "trigonal",
     5.60, -3.76, 6.52, 0.90, 3.79, 1.0, 2.54,
     [{"el": "La", "x": 0.0, "y": 0.0, "z": 0.25}, {"el": "Al", "x": 0.0, "y": 0.0, "z": 0.0},
      {"el": "O", "x": 0.524, "y": 0.0, "z": 0.25}]),
    ("CaTiO3", ["Ca", "Ti", "O"], {"Ca": 0.2, "Ti": 0.2, "O": 0.6}, "orthorhombic",
     3.50, -3.55, 4.04, 0.88, 5.38, 0.98, 1.42,
     [{"el": "Ca", "x": 0.0, "y": 0.25, "z": 0.005}, {"el": "Ti", "x": 0.0, "y": 0.0, "z": 0.5},
      {"el": "O", "x": 0.25, "y": 0.0, "z": 0.0}]),

    # --- Battery materials ---
    ("LiCoO2", ["Li", "Co", "O"], {"Li": 0.25, "Co": 0.25, "O": 0.5}, "trigonal",
     2.70, -2.36, 5.05, 0.85, 2.82, 1.0, 4.99,
     [{"el": "Li", "x": 0.0, "y": 0.0, "z": 0.5}, {"el": "Co", "x": 0.0, "y": 0.0, "z": 0.0},
      {"el": "O", "x": 0.0, "y": 0.0, "z": 0.260}]),
    ("LiFePO4", ["Li", "Fe", "P", "O"], {"Li": 0.143, "Fe": 0.143, "P": 0.143, "O": 0.571}, "orthorhombic",
     3.84, -3.18, 3.60, 0.90, 10.33, 0.58, 0.46,
     [{"el": "Li", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Fe", "x": 0.282, "y": 0.25, "z": 0.975},
      {"el": "P", "x": 0.095, "y": 0.25, "z": 0.418}, {"el": "O", "x": 0.097, "y": 0.25, "z": 0.743}]),
    ("LiMn2O4", ["Li", "Mn", "O"], {"Li": 0.143, "Mn": 0.286, "O": 0.571}, "cubic",
     1.80, -2.78, 4.28, 0.82, 8.25, 1.0, 1.0,
     [{"el": "Li", "x": 0.125, "y": 0.125, "z": 0.125}, {"el": "Mn", "x": 0.5, "y": 0.5, "z": 0.5},
      {"el": "O", "x": 0.263, "y": 0.263, "z": 0.263}]),
    ("NaMnO2", ["Na", "Mn", "O"], {"Na": 0.25, "Mn": 0.25, "O": 0.5}, "monoclinic",
     1.50, -2.10, 4.15, 0.78, 5.67, 0.50, 1.23,
     [{"el": "Na", "x": 0.0, "y": 0.0, "z": 0.5}, {"el": "Mn", "x": 0.0, "y": 0.0, "z": 0.0},
      {"el": "O", "x": 0.0, "y": 0.0, "z": 0.233}]),

    # --- Nitrides / carbides ---
    ("TiN", ["Ti", "N"], {"Ti": 0.5, "N": 0.5}, "cubic",
     0.0, -1.65, 5.40, 0.92, 4.24, 1.0, 1.0,
     [{"el": "Ti", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "N", "x": 0.5, "y": 0.5, "z": 0.5}]),
    ("WC", ["W", "C"], {"W": 0.5, "C": 0.5}, "hexagonal",
     0.0, -0.41, 15.63, 0.88, 2.91, 1.0, 0.98,
     [{"el": "W", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "C", "x": 0.333, "y": 0.667, "z": 0.5}]),
    ("CrN", ["Cr", "N"], {"Cr": 0.5, "N": 0.5}, "cubic",
     0.0, -1.20, 6.12, 0.85, 4.15, 1.0, 1.0,
     [{"el": "Cr", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "N", "x": 0.5, "y": 0.5, "z": 0.5}]),

    # --- Chalcogenides ---
    ("MoS2", ["Mo", "S"], {"Mo": 0.333, "S": 0.667}, "hexagonal",
     1.80, -1.17, 5.06, 0.88, 3.16, 1.0, 3.89,
     [{"el": "Mo", "x": 0.333, "y": 0.667, "z": 0.25}, {"el": "S", "x": 0.333, "y": 0.667, "z": 0.621}]),
    ("WS2", ["W", "S"], {"W": 0.333, "S": 0.667}, "hexagonal",
     1.35, -0.98, 7.50, 0.85, 3.15, 1.0, 3.92,
     [{"el": "W", "x": 0.333, "y": 0.667, "z": 0.25}, {"el": "S", "x": 0.333, "y": 0.667, "z": 0.625}]),
    ("Bi2Te3", ["Bi", "Te"], {"Bi": 0.4, "Te": 0.6}, "trigonal",
     0.13, -0.26, 7.86, 0.80, 4.38, 1.0, 6.95,
     [{"el": "Bi", "x": 0.0, "y": 0.0, "z": 0.400}, {"el": "Te", "x": 0.0, "y": 0.0, "z": 0.0}]),
    ("PbTe", ["Pb", "Te"], {"Pb": 0.5, "Te": 0.5}, "cubic",
     0.31, -0.50, 8.16, 0.82, 6.46, 1.0, 1.0,
     [{"el": "Pb", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Te", "x": 0.5, "y": 0.5, "z": 0.5}]),

    # --- Spinels / garnets ---
    ("MgAl2O4", ["Mg", "Al", "O"], {"Mg": 0.143, "Al": 0.286, "O": 0.571}, "cubic",
     7.80, -3.72, 3.58, 0.92, 8.08, 1.0, 1.0,
     [{"el": "Mg", "x": 0.125, "y": 0.125, "z": 0.125}, {"el": "Al", "x": 0.5, "y": 0.5, "z": 0.5},
      {"el": "O", "x": 0.263, "y": 0.263, "z": 0.263}]),
    ("Fe3O4", ["Fe", "O"], {"Fe": 0.429, "O": 0.571}, "cubic",
     0.10, -2.76, 5.17, 0.85, 8.39, 1.0, 1.0,
     [{"el": "Fe", "x": 0.125, "y": 0.125, "z": 0.125}, {"el": "Fe", "x": 0.5, "y": 0.5, "z": 0.5},
      {"el": "O", "x": 0.255, "y": 0.255, "z": 0.255}]),
    ("Y3Al5O12", ["Y", "Al", "O"], {"Y": 0.15, "Al": 0.25, "O": 0.60}, "cubic",
     6.50, -3.88, 4.56, 0.90, 12.01, 1.0, 1.0,
     [{"el": "Y", "x": 0.125, "y": 0.0, "z": 0.25}, {"el": "Al", "x": 0.0, "y": 0.0, "z": 0.0},
      {"el": "O", "x": 0.030, "y": 0.050, "z": 0.150}]),

    # --- Halides ---
    ("NaCl", ["Na", "Cl"], {"Na": 0.5, "Cl": 0.5}, "cubic",
     8.50, -1.88, 2.17, 0.95, 5.64, 1.0, 1.0,
     [{"el": "Na", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Cl", "x": 0.5, "y": 0.5, "z": 0.5}]),
    ("CaF2", ["Ca", "F"], {"Ca": 0.333, "F": 0.667}, "cubic",
     11.80, -3.22, 3.18, 0.95, 5.46, 1.0, 1.0,
     [{"el": "Ca", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "F", "x": 0.25, "y": 0.25, "z": 0.25}]),
    ("CsPbI3", ["Cs", "Pb", "I"], {"Cs": 0.2, "Pb": 0.2, "I": 0.6}, "orthorhombic",
     1.73, -1.05, 4.84, 0.55, 8.86, 0.99, 1.44,
     [{"el": "Cs", "x": 0.0, "y": 0.25, "z": 0.0}, {"el": "Pb", "x": 0.5, "y": 0.0, "z": 0.0},
      {"el": "I", "x": 0.25, "y": 0.0, "z": 0.0}]),

    # --- Metals / intermetallics ---
    ("NiTi", ["Ni", "Ti"], {"Ni": 0.5, "Ti": 0.5}, "cubic",
     0.0, -0.35, 6.45, 0.85, 3.01, 1.0, 1.0,
     [{"el": "Ni", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Ti", "x": 0.5, "y": 0.5, "z": 0.5}]),
    ("FeAl", ["Fe", "Al"], {"Fe": 0.5, "Al": 0.5}, "cubic",
     0.0, -0.38, 5.56, 0.82, 2.91, 1.0, 1.0,
     [{"el": "Fe", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Al", "x": 0.5, "y": 0.5, "z": 0.5}]),
    ("Ni3Al", ["Ni", "Al"], {"Ni": 0.75, "Al": 0.25}, "cubic",
     0.0, -0.45, 7.50, 0.88, 3.57, 1.0, 1.0,
     [{"el": "Ni", "x": 0.5, "y": 0.5, "z": 0.0}, {"el": "Al", "x": 0.0, "y": 0.0, "z": 0.0}]),
    ("TiAl", ["Ti", "Al"], {"Ti": 0.5, "Al": 0.5}, "tetragonal",
     0.0, -0.39, 3.76, 0.80, 3.98, 1.0, 1.02,
     [{"el": "Ti", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "Al", "x": 0.5, "y": 0.5, "z": 0.5}]),

    # --- Miscellaneous ---
    ("CaCO3", ["Ca", "C", "O"], {"Ca": 0.2, "C": 0.2, "O": 0.6}, "trigonal",
     6.00, -3.24, 2.71, 0.92, 4.99, 1.0, 3.42,
     [{"el": "Ca", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "C", "x": 0.0, "y": 0.0, "z": 0.25},
      {"el": "O", "x": 0.257, "y": 0.0, "z": 0.25}]),
    ("BaSO4", ["Ba", "S", "O"], {"Ba": 0.167, "S": 0.167, "O": 0.667}, "orthorhombic",
     6.50, -3.65, 4.50, 0.90, 8.88, 0.62, 0.82,
     [{"el": "Ba", "x": 0.184, "y": 0.25, "z": 0.158}, {"el": "S", "x": 0.437, "y": 0.25, "z": 0.190},
      {"el": "O", "x": 0.592, "y": 0.25, "z": 0.092}]),
    ("Li3PS4", ["Li", "P", "S"], {"Li": 0.375, "P": 0.125, "S": 0.5}, "orthorhombic",
     3.68, -2.10, 1.87, 0.75, 13.0, 0.59, 0.47,
     [{"el": "Li", "x": 0.0, "y": 0.0, "z": 0.5}, {"el": "P", "x": 0.0, "y": 0.0, "z": 0.0},
      {"el": "S", "x": 0.0, "y": 0.0, "z": 0.22}]),
    ("ZrO2", ["Zr", "O"], {"Zr": 0.333, "O": 0.667}, "monoclinic",
     5.83, -3.64, 5.68, 0.90, 5.15, 1.01, 1.03,
     [{"el": "Zr", "x": 0.276, "y": 0.040, "z": 0.208}, {"el": "O", "x": 0.070, "y": 0.332, "z": 0.345}]),
    ("HfO2", ["Hf", "O"], {"Hf": 0.333, "O": 0.667}, "monoclinic",
     5.70, -3.81, 9.68, 0.92, 5.12, 1.01, 1.03,
     [{"el": "Hf", "x": 0.276, "y": 0.040, "z": 0.208}, {"el": "O", "x": 0.070, "y": 0.332, "z": 0.345}]),
    ("V2O5", ["V", "O"], {"V": 0.286, "O": 0.714}, "orthorhombic",
     2.30, -2.58, 3.36, 0.80, 11.52, 0.31, 0.38,
     [{"el": "V", "x": 0.149, "y": 0.0, "z": 0.109}, {"el": "O", "x": 0.149, "y": 0.0, "z": 0.469}]),
    ("Nb2O5", ["Nb", "O"], {"Nb": 0.286, "O": 0.714}, "monoclinic",
     3.40, -2.84, 4.60, 0.82, 12.73, 0.37, 0.30,
     [{"el": "Nb", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "O", "x": 0.1, "y": 0.1, "z": 0.1}]),
    ("CoO", ["Co", "O"], {"Co": 0.5, "O": 0.5}, "cubic",
     2.40, -1.23, 6.44, 0.80, 4.26, 1.0, 1.0,
     [{"el": "Co", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "O", "x": 0.5, "y": 0.5, "z": 0.5}]),
    ("NiO", ["Ni", "O"], {"Ni": 0.5, "O": 0.5}, "cubic",
     3.70, -1.26, 6.67, 0.82, 4.18, 1.0, 1.0,
     [{"el": "Ni", "x": 0.0, "y": 0.0, "z": 0.0}, {"el": "O", "x": 0.5, "y": 0.5, "z": 0.5}]),
    ("CuO", ["Cu", "O"], {"Cu": 0.5, "O": 0.5}, "monoclinic",
     1.20, -0.78, 6.31, 0.78, 4.68, 0.73, 1.09,
     [{"el": "Cu", "x": 0.25, "y": 0.25, "z": 0.0}, {"el": "O", "x": 0.0, "y": 0.418, "z": 0.25}]),
]


def _anonymous_formula(elements: list[str]) -> str:
    """Generate anonymous formula like AB2, ABC3, etc."""
    labels = "ABCDEFGH"
    return "".join(labels[i] if i < len(labels) else f"X{i}" for i in range(len(elements)))


def _jitter(value: float, pct: float = 0.10) -> float:
    """Add Gaussian noise to a value."""
    if value == 0:
        return 0.0
    return value * (1.0 + random.gauss(0, pct))


def _make_external_id(source: str, idx: int) -> str:
    """Generate a realistic-looking external ID."""
    if source == "materials_project":
        return f"mp-{random.randint(1, 999999)}"
    elif source == "aflow":
        prefix = hashlib.md5(f"aflow-{idx}".encode()).hexdigest()[:12]
        return f"aflow:{prefix}"
    else:
        return f"oqmd-{random.randint(1, 999999)}"


def _make_source_url(source: str, ext_id: str) -> str:
    if source == "materials_project":
        return f"https://next-gen.materialsproject.org/materials/{ext_id}"
    elif source == "aflow":
        return f"http://aflow.org/material/?id={ext_id}"
    else:
        return f"https://oqmd.org/materials/entry/{ext_id.replace('oqmd-', '')}"


def seed_materials(db: Session, count: int = 1000) -> int:
    """Generate and insert realistic indexed materials.

    Returns the number of materials inserted.
    """
    existing = db.query(IndexedMaterial.id).limit(1).first()
    if existing:
        logger.info("Indexed materials table already seeded, skipping.")
        return 0

    logger.info(f"Seeding {count} indexed materials ...")

    rng = random.Random(42)
    random.seed(42)

    records: list[IndexedMaterial] = []
    seen_ext_ids: set[str] = set()

    for i in range(count):
        tmpl = MATERIAL_TEMPLATES[i % len(MATERIAL_TEMPLATES)]
        (
            formula, elements, composition, crystal_system,
            bg_center, fe_center, density_center, stable_prob,
            lat_a, lat_ratio_b, lat_ratio_c, sites,
        ) = tmpl

        # Pick source DB
        source = rng.choices(SOURCE_DBS, weights=SOURCE_WEIGHTS, k=1)[0]

        # Generate unique external id
        for _ in range(50):
            ext_id = _make_external_id(source, i)
            if ext_id not in seen_ext_ids:
                break
        seen_ext_ids.add(ext_id)

        # Jitter properties to create variation
        band_gap = max(0.0, _jitter(bg_center, 0.15)) if bg_center > 0 else 0.0
        formation_energy = _jitter(fe_center, 0.12)
        density = max(0.5, _jitter(density_center, 0.08))
        is_stable = rng.random() < stable_prob
        energy_above_hull = 0.0 if is_stable else rng.uniform(0.001, 0.35)

        # Lattice parameters with jitter
        a = _jitter(lat_a, 0.03)
        b = a * _jitter(lat_ratio_b, 0.02)
        c = a * _jitter(lat_ratio_c, 0.02)
        alpha, beta, gamma = 90.0, 90.0, 90.0
        if crystal_system == "hexagonal" or crystal_system == "trigonal":
            gamma = 120.0
        elif crystal_system == "monoclinic":
            beta = _jitter(99.0, 0.05)
        elif crystal_system == "triclinic":
            alpha = _jitter(85.0, 0.03)
            beta = _jitter(95.0, 0.03)
            gamma = _jitter(87.0, 0.03)

        lattice_params = {
            "a": round(a, 4),
            "b": round(b, 4),
            "c": round(c, 4),
            "alpha": round(alpha, 2),
            "beta": round(beta, 2),
            "gamma": round(gamma, 2),
        }

        volume = a * b * c  # simplified (ignoring angles for estimate)
        if crystal_system in ("hexagonal", "trigonal"):
            volume *= math.sin(math.radians(120.0))

        # Space group
        sg = rng.choice(SPACE_GROUPS_BY_SYSTEM.get(crystal_system, ["P1"]))

        # Magnetization and magnetic ordering
        total_mag = 0.0
        magnetic_ordering = "non-magnetic"
        if band_gap == 0.0 and "Fe" in elements:
            total_mag = _jitter(2.2, 0.15)
            magnetic_ordering = "ferromagnetic"
        elif band_gap == 0.0 and "Co" in elements:
            total_mag = _jitter(1.72, 0.15)
            magnetic_ordering = "ferromagnetic"
        elif band_gap == 0.0 and "Ni" in elements:
            total_mag = _jitter(0.60, 0.15)
            magnetic_ordering = "ferromagnetic"
        elif band_gap == 0.0 and ("Mn" in elements or "Cr" in elements):
            total_mag = _jitter(0.3, 0.20)
            magnetic_ordering = "antiferromagnetic"
        elif band_gap > 0:
            magnetic_ordering = "diamagnetic"

        # Mechanical properties (realistic ranges based on material class)
        bulk_modulus = None
        shear_modulus = None
        young_modulus = None
        poisson_ratio = None
        if band_gap == 0.0:  # metals
            bulk_modulus = _jitter(160.0, 0.30)
            shear_modulus = _jitter(80.0, 0.30)
            poisson_ratio = _jitter(0.30, 0.10)
        elif band_gap < 4.0:  # semiconductors
            bulk_modulus = _jitter(80.0, 0.25)
            shear_modulus = _jitter(50.0, 0.25)
            poisson_ratio = _jitter(0.26, 0.10)
        else:  # insulators
            bulk_modulus = _jitter(200.0, 0.30)
            shear_modulus = _jitter(120.0, 0.30)
            poisson_ratio = _jitter(0.22, 0.10)
        if bulk_modulus and shear_modulus and (3 * bulk_modulus + shear_modulus) > 0:
            young_modulus = 9 * bulk_modulus * shear_modulus / (3 * bulk_modulus + shear_modulus)

        # Electronic properties
        dielectric_constant = None
        refractive_index = None
        if band_gap > 0:
            dielectric_constant = _jitter(max(3.0, 30.0 / max(band_gap, 0.5)), 0.20)
            refractive_index = _jitter(max(1.5, 4.0 / max(band_gap, 0.5) ** 0.5), 0.10)

        # Thermal properties
        thermal_conductivity = None
        seebeck_coefficient = None
        if band_gap == 0.0:
            thermal_conductivity = _jitter(50.0, 0.40)
        elif band_gap < 2.0:
            thermal_conductivity = _jitter(10.0, 0.40)
            seebeck_coefficient = _jitter(200.0, 0.30)
        else:
            thermal_conductivity = _jitter(3.0, 0.40)

        # Carrier properties
        eff_mass_e = None
        eff_mass_h = None
        if 0 < band_gap < 5.0:
            eff_mass_e = _jitter(0.3, 0.40)
            eff_mass_h = _jitter(0.5, 0.40)

        # Oxidation states
        oxidation_states = {}
        for el in elements:
            ox_map = {
                "Li": 1, "Na": 1, "K": 1, "Ca": 2, "Mg": 2, "Ba": 2, "Sr": 2,
                "Al": 3, "Fe": 3, "Co": 2, "Ni": 2, "Cu": 2, "Zn": 2,
                "Ti": 4, "Zr": 4, "Hf": 4, "V": 5, "Nb": 5, "Cr": 3, "Mn": 4,
                "Si": 4, "Ge": 4, "Sn": 4, "Pb": 2, "Bi": 3,
                "O": -2, "S": -2, "Se": -2, "Te": -2,
                "N": -3, "P": -3, "As": -3,
                "F": -1, "Cl": -1, "Br": -1, "I": -1,
                "C": 4, "B": 3, "Ga": 3, "In": 3, "La": 3, "Ce": 4, "Y": 3,
                "W": 6, "Mo": 4, "Cs": 1,
            }
            if el in ox_map:
                oxidation_states[el] = ox_map[el]

        is_theoretical = True
        calculation_method = rng.choice(["GGA-PBE", "GGA-PBE", "GGA-PBE", "HSE06", "GGA+U"])
        warnings_list: list[str] = []
        if not is_stable:
            warnings_list.append("Structure may be thermodynamically unstable")
        if crystal_system == "triclinic":
            warnings_list.append("Low-symmetry structure — DFT approximation may be less reliable")

        # Build structure data for 3D viewer
        structure_data = {
            "lattice": lattice_params,
            "sites": [
                {
                    "element": s["el"],
                    "abc": [s["x"], s["y"], s["z"]],
                    "xyz": [
                        round(s["x"] * a, 4),
                        round(s["y"] * b, 4),
                        round(s["z"] * c, 4),
                    ],
                }
                for s in sites
            ],
        }

        # Tags
        tags = []
        if band_gap > 0:
            tags.append("semiconductor" if band_gap < 4.0 else "insulator")
        else:
            tags.append("metal")
        if is_stable:
            tags.append("stable")
        if len(elements) == 1:
            tags.append("elemental")
        if "Li" in elements:
            tags.append("battery")
        # Only tag thermoelectric if we actually have thermoelectric data
        if seebeck_coefficient is not None:
            tags.append("thermoelectric")

        record = IndexedMaterial(
            id=str(uuid.uuid4()),
            external_id=ext_id,
            source_db=source,
            formula=formula,
            formula_anonymous=_anonymous_formula(elements),
            elements=elements,
            n_elements=len(elements),
            composition=composition,
            band_gap=round(band_gap, 4),
            formation_energy=round(formation_energy, 4),
            energy_above_hull=round(energy_above_hull, 4),
            density=round(density, 3),
            total_magnetization=round(total_mag, 3) if total_mag else None,
            magnetic_ordering=magnetic_ordering,
            volume=round(volume, 3),
            space_group=sg,
            crystal_system=crystal_system,
            lattice_params=lattice_params,
            structure_data=structure_data,
            # Mechanical
            bulk_modulus=round(bulk_modulus, 2) if bulk_modulus else None,
            shear_modulus=round(shear_modulus, 2) if shear_modulus else None,
            young_modulus=round(young_modulus, 2) if young_modulus else None,
            poisson_ratio=round(poisson_ratio, 4) if poisson_ratio else None,
            # Electronic
            dielectric_constant=round(dielectric_constant, 2) if dielectric_constant else None,
            refractive_index=round(refractive_index, 3) if refractive_index else None,
            # Thermal
            thermal_conductivity=round(thermal_conductivity, 2) if thermal_conductivity else None,
            seebeck_coefficient=round(seebeck_coefficient, 1) if seebeck_coefficient else None,
            # Carrier
            effective_mass_electron=round(eff_mass_e, 4) if eff_mass_e else None,
            effective_mass_hole=round(eff_mass_h, 4) if eff_mass_h else None,
            # Provenance
            oxidation_states=oxidation_states if oxidation_states else None,
            calculation_method=calculation_method,
            is_theoretical=is_theoretical,
            warnings=warnings_list if warnings_list else None,
            properties_json={
                "band_gap": round(band_gap, 4),
                "formation_energy_per_atom": round(formation_energy, 4),
                "energy_above_hull": round(energy_above_hull, 4),
                "density": round(density, 3),
            },
            source_url=_make_source_url(source, ext_id),
            is_stable=is_stable,
            tags=tags,
        )
        records.append(record)

    db.bulk_save_objects(records)
    db.commit()

    logger.info(f"Successfully seeded {len(records)} indexed materials.")
    return len(records)
