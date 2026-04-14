"""GNoME static dataset connector — Google DeepMind's Graph Networks for Materials Exploration."""

from __future__ import annotations

import csv
import json
import logging
import os
import re
from dataclasses import dataclass
from pathlib import Path

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)


@dataclass
class GnomeConfig(ConnectorConfig):
    """Configuration for GNoME connector.

    data_dir: path to directory containing GNoME data files
              (e.g., stable_materials_summary.csv).
              Downloadable from https://github.com/google-deepmind/materials_discovery
    """

    data_dir: str = ""


class GnomeConnector(DatasetConnector):
    """Access Google DeepMind's GNoME dataset (~380,000 stable materials).

    GNoME (Graph Networks for Materials Exploration) predicted 2.2M
    stable crystal structures. This connector reads from locally
    downloaded data files (CSV or JSON format).

    Set data_dir via config or GNOME_DATA_DIR environment variable.
    """

    def __init__(self, config: GnomeConfig | None = None) -> None:
        cfg = config or GnomeConfig()
        super().__init__(cfg)
        data_dir = getattr(cfg, "data_dir", "") or os.environ.get("GNOME_DATA_DIR", "")
        self._data_dir = Path(data_dir) if data_dir else None
        self._records: list[dict] | None = None

    def _load_data(self) -> list[dict]:
        """Lazily load GNoME data from disk."""
        if self._records is not None:
            return self._records

        if not self._data_dir or not self._data_dir.exists():
            logger.warning(
                f"GNoME data directory not found: {self._data_dir}. "
                "Set GNOME_DATA_DIR env var or config.data_dir to the path "
                "containing stable_materials_summary.csv"
            )
            self._records = []
            return self._records

        csv_path = self._data_dir / "stable_materials_summary.csv"
        json_path = self._data_dir / "stable_materials_summary.json"

        if csv_path.exists():
            self._records = self._load_csv(csv_path)
        elif json_path.exists():
            self._records = self._load_json(json_path)
        else:
            logger.warning(
                f"No GNoME data files found in {self._data_dir}. "
                "Expected stable_materials_summary.csv or .json"
            )
            self._records = []

        logger.info(f"Loaded {len(self._records)} GNoME records")
        return self._records

    @staticmethod
    def _load_csv(path: Path) -> list[dict]:
        records = []
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                record: dict = {"material_id": row.get("material_id", "")}
                record["formula"] = row.get("formula", row.get("composition", ""))

                for key in (
                    "formation_energy_per_atom",
                    "energy_above_hull",
                    "decomposition_energy",
                    "is_stable",
                    "volume",
                    "density",
                ):
                    val = row.get(key)
                    if val is not None and val != "":
                        try:
                            record[key] = float(val)
                        except ValueError:
                            pass
                records.append(record)
        return records

    @staticmethod
    def _load_json(path: Path) -> list[dict]:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else data.get("materials", [])

    @staticmethod
    def _extract_elements(formula: str) -> set[str]:
        return set(re.findall(r"[A-Z][a-z]?", formula))

    def search(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
        max_results: int = 100,
    ) -> list[DatasetEntry]:
        """Search locally loaded GNoME data."""
        records = self._load_data()
        results: list[DatasetEntry] = []

        for record in records:
            if len(results) >= max_results:
                break

            rec_formula = record.get("formula", "")

            if elements:
                rec_elements = self._extract_elements(rec_formula)
                if not set(elements).issubset(rec_elements):
                    continue

            if formula and rec_formula != formula:
                continue

            properties: dict[str, float] = {}
            for key in (
                "formation_energy_per_atom",
                "energy_above_hull",
                "decomposition_energy",
                "is_stable",
                "volume",
                "density",
            ):
                if key in record and isinstance(record[key], (int, float)):
                    properties[key] = float(record[key])

            if property_range:
                skip = False
                for prop_name, (lo, hi) in property_range.items():
                    if prop_name in properties:
                        if not (lo <= properties[prop_name] <= hi):
                            skip = True
                            break
                if skip:
                    continue

            results.append(
                DatasetEntry(
                    external_id=str(record.get("material_id", "")),
                    formula=rec_formula,
                    properties=properties,
                    source_db="gnome",
                )
            )

        return results

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Look up a single GNoME material by ID."""
        records = self._load_data()

        for record in records:
            if str(record.get("material_id", "")) == external_id:
                properties: dict[str, float] = {}
                for key in (
                    "formation_energy_per_atom",
                    "energy_above_hull",
                    "decomposition_energy",
                    "is_stable",
                ):
                    if key in record and isinstance(record[key], (int, float)):
                        properties[key] = float(record[key])

                return DatasetEntry(
                    external_id=external_id,
                    formula=record.get("formula", ""),
                    properties=properties,
                    source_db="gnome",
                )

        return DatasetEntry(
            external_id=external_id,
            formula="",
            properties={},
            source_db="gnome",
        )
