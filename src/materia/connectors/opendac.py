"""OpenDAC static dataset connector — Open Direct Air Capture dataset from Meta FAIR."""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)


@dataclass
class OpenDACConfig(ConnectorConfig):
    """Configuration for OpenDAC connector.

    data_dir: path to directory containing OpenDAC metadata files.
              Downloadable from https://open-dac.github.io/
    """

    data_dir: str = ""


class OpenDACConnector(DatasetConnector):
    """Access Meta FAIR's OpenDAC dataset (~50,000 adsorbate-catalyst systems).

    OpenDAC (Open Direct Air Capture) contains DFT-computed adsorption
    energies for CO2/H2O on various catalyst surfaces, useful for
    direct air capture materials design.

    Set data_dir via config or OPENDAC_DATA_DIR environment variable.
    """

    def __init__(self, config: Optional[OpenDACConfig] = None) -> None:
        cfg = config or OpenDACConfig()
        super().__init__(cfg)
        data_dir = getattr(cfg, "data_dir", "") or os.environ.get("OPENDAC_DATA_DIR", "")
        self._data_dir = Path(data_dir) if data_dir else None
        self._records: list[dict] | None = None

    def _load_data(self) -> list[dict]:
        """Lazily load OpenDAC metadata from disk."""
        if self._records is not None:
            return self._records

        if not self._data_dir or not self._data_dir.exists():
            logger.warning(
                f"OpenDAC data directory not found: {self._data_dir}. "
                "Set OPENDAC_DATA_DIR env var or config.data_dir to the path "
                "containing metadata.json"
            )
            self._records = []
            return self._records

        json_path = self._data_dir / "metadata.json"
        jsonl_path = self._data_dir / "metadata.jsonl"

        if json_path.exists():
            with open(json_path, encoding="utf-8") as f:
                data = json.load(f)
            self._records = data if isinstance(data, list) else data.get("systems", [])
        elif jsonl_path.exists():
            self._records = []
            with open(jsonl_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        self._records.append(json.loads(line))
        else:
            logger.warning(
                f"No OpenDAC data files found in {self._data_dir}. "
                "Expected metadata.json or metadata.jsonl"
            )
            self._records = []

        logger.info(f"Loaded {len(self._records)} OpenDAC records")
        return self._records

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
        """Search locally loaded OpenDAC data."""
        records = self._load_data()
        results: list[DatasetEntry] = []

        for record in records:
            if len(results) >= max_results:
                break

            catalyst_formula = record.get("catalyst_formula", record.get("formula", ""))
            adsorbate = record.get("adsorbate", "")

            if elements:
                all_elements = self._extract_elements(catalyst_formula)
                if adsorbate:
                    all_elements |= self._extract_elements(adsorbate)
                if not set(elements).issubset(all_elements):
                    continue

            if formula and catalyst_formula != formula:
                continue

            properties: dict[str, float] = {}
            prop_keys = {
                "adsorption_energy": "adsorption_energy",
                "energy": "adsorption_energy",
                "dft_energy": "dft_energy",
                "miller_index_h": "miller_h",
                "miller_index_k": "miller_k",
                "miller_index_l": "miller_l",
            }
            for src_key, dst_key in prop_keys.items():
                val = record.get(src_key)
                if val is not None and isinstance(val, (int, float)):
                    properties[dst_key] = float(val)

            if property_range:
                skip = False
                for prop_name, (lo, hi) in property_range.items():
                    if prop_name in properties:
                        if not (lo <= properties[prop_name] <= hi):
                            skip = True
                            break
                if skip:
                    continue

            display_formula = catalyst_formula
            if adsorbate:
                display_formula = f"{adsorbate}@{catalyst_formula}"

            results.append(
                DatasetEntry(
                    external_id=str(record.get("system_id", record.get("id", ""))),
                    formula=display_formula,
                    properties=properties,
                    metadata={"adsorbate": adsorbate, "catalyst": catalyst_formula},
                    source_db="opendac",
                )
            )

        return results

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Look up a single OpenDAC system by ID."""
        records = self._load_data()

        for record in records:
            sid = str(record.get("system_id", record.get("id", "")))
            if sid == external_id:
                properties: dict[str, float] = {}
                for key in ("adsorption_energy", "energy", "dft_energy"):
                    val = record.get(key)
                    if val is not None and isinstance(val, (int, float)):
                        prop_name = "adsorption_energy" if key in ("adsorption_energy", "energy") else key
                        properties[prop_name] = float(val)

                catalyst = record.get("catalyst_formula", "")
                adsorbate = record.get("adsorbate", "")
                display = f"{adsorbate}@{catalyst}" if adsorbate else catalyst

                return DatasetEntry(
                    external_id=external_id,
                    formula=display,
                    properties=properties,
                    metadata={"adsorbate": adsorbate, "catalyst": catalyst},
                    source_db="opendac",
                )

        return DatasetEntry(
            external_id=external_id,
            formula="",
            properties={},
            source_db="opendac",
        )
