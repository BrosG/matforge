"""Perovskite Database connector — domain-specific solar perovskite data."""

from __future__ import annotations

import json
import logging
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)

PEROVSKITE_BASE_URL = "https://www.perovskitedatabase.com/api"


class PerovskiteConnector(DatasetConnector):
    """Fetches data from the Perovskite Database (~42,000 entries).

    Specialised database for halide perovskite solar cells with
    properties like band gap, power conversion efficiency (PCE),
    tolerance factor, and formation energy.

    No API key required.
    """

    def __init__(self, config: ConnectorConfig | None = None) -> None:
        cfg = config or ConnectorConfig(base_url=PEROVSKITE_BASE_URL)
        if not cfg.base_url:
            cfg.base_url = PEROVSKITE_BASE_URL
        super().__init__(cfg)

    def search(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
        max_results: int = 100,
    ) -> list[DatasetEntry]:
        """Search the Perovskite Database."""
        params: dict[str, str] = {
            "limit": str(min(max_results, self.config.max_results)),
        }

        if elements:
            params["elements"] = ",".join(elements)
        if formula:
            params["formula"] = formula

        url = f"{self.config.base_url}/materials?{urlencode(params)}"
        req = Request(url)
        req.add_header("Accept", "application/json")

        try:
            with urlopen(req, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except URLError as e:
            logger.error(f"Perovskite Database API error: {e}")
            return []

        items = (
            data
            if isinstance(data, list)
            else data.get("materials", data.get("data", []))
        )

        entries: list[DatasetEntry] = []
        for item in items[:max_results]:
            entry_id = item.get("id", item.get("material_id", ""))
            formula_str = item.get("formula", item.get("composition", ""))

            properties: dict[str, float] = {}
            prop_keys = {
                "band_gap": "band_gap",
                "bandgap": "band_gap",
                "formation_energy": "formation_energy",
                "tolerance_factor": "tolerance_factor",
                "pce": "pce",
                "power_conversion_efficiency": "pce",
                "voc": "open_circuit_voltage",
                "jsc": "short_circuit_current",
                "fill_factor": "fill_factor",
                "stability": "stability",
            }
            for src_key, dst_key in prop_keys.items():
                val = item.get(src_key)
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

            entries.append(
                DatasetEntry(
                    external_id=str(entry_id),
                    formula=formula_str,
                    properties=properties,
                    source_db="perovskite_db",
                )
            )
        return entries

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single perovskite material by ID."""
        url = f"{self.config.base_url}/materials/{external_id}"
        req = Request(url)
        req.add_header("Accept", "application/json")

        with urlopen(req, timeout=self.config.timeout) as response:
            data = json.loads(response.read().decode())

        item = data if isinstance(data, dict) else {}

        properties: dict[str, float] = {}
        for key in ("band_gap", "formation_energy", "tolerance_factor", "pce"):
            val = item.get(key)
            if val is not None and isinstance(val, (int, float)):
                properties[key] = float(val)

        return DatasetEntry(
            external_id=str(item.get("id", external_id)),
            formula=item.get("formula", ""),
            properties=properties,
            source_db="perovskite_db",
        )
