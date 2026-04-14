"""Shared enums and type aliases for MATERIA."""

from __future__ import annotations

import enum


class MaterialSource(enum.Enum):
    """Origin of property data for a material."""

    PHYSICS = "physics"
    SURROGATE = "surrogate"
    EXPERIMENT = "experiment"
    INITIAL = "initial"


class ObjectiveDirection(enum.Enum):
    """Direction of optimization for an objective."""

    MINIMIZE = "minimize"
    MAXIMIZE = "maximize"
