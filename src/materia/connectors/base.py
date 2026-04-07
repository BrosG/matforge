"""Abstract base class for public dataset connectors."""

from __future__ import annotations

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from materia.material import Material
from materia.mdl import MaterialDef
from materia.types import MaterialSource


@dataclass
class ConnectorConfig:
    """Configuration for dataset connectors."""

    api_key: str = ""
    base_url: str = ""
    timeout: int = 30
    max_results: int = 100


@dataclass
class DatasetEntry:
    """A single entry from a public database."""

    external_id: str
    formula: str
    properties: dict[str, float]
    structure: dict = field(default_factory=dict)
    source_db: str = ""
    metadata: dict = field(default_factory=dict)


class DatasetConnector(ABC):
    """Fetches materials data from public databases."""

    def __init__(self, config: Optional[ConnectorConfig] = None) -> None:
        self.config = config or ConnectorConfig()

    @abstractmethod
    def search(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
        max_results: int = 100,
    ) -> list[DatasetEntry]:
        """Search the database for matching materials."""
        ...

    @abstractmethod
    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single material by its database ID."""
        ...

    def to_materials(
        self,
        entries: list[DatasetEntry],
        material_def: MaterialDef,
    ) -> list[Material]:
        """Convert database entries to Material objects."""
        materials = []
        for entry in entries:
            props = {}
            for obj in material_def.objectives:
                if obj.name in entry.properties:
                    props[obj.name] = entry.properties[obj.name]

            params = np.full(material_def.input_dim, 0.5)
            for i, p_def in enumerate(material_def.parameters):
                if p_def.name in entry.properties:
                    lo, hi = p_def.range
                    val = entry.properties[p_def.name]
                    params[i] = (
                        np.clip((val - lo) / (hi - lo), 0, 1) if hi > lo else 0.5
                    )

            composition = parse_formula(entry.formula)

            materials.append(
                Material(
                    params=params,
                    properties=props,
                    composition=composition,
                    source=MaterialSource.EXPERIMENT,
                    metadata={
                        "external_id": entry.external_id,
                        "source_db": entry.source_db,
                        "formula": entry.formula,
                    },
                )
            )
        return materials


def parse_formula(formula: str) -> dict[str, float]:
    """Parse a chemical formula like 'Fe2O3' into {'Fe': 0.4, 'O': 0.6}."""
    pattern = r"([A-Z][a-z]?)(\d*\.?\d*)"
    matches = re.findall(pattern, formula)
    counts: dict[str, float] = {}
    for elem, count in matches:
        if elem:
            counts[elem] = float(count) if count else 1.0
    total = sum(counts.values())
    return {k: v / total for k, v in counts.items()} if total > 0 else {}
