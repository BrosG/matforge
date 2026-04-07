"""Materials Project connector via REST API."""

from __future__ import annotations

import json
import logging
import os
from typing import Optional
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)

MP_BASE_URL = "https://api.materialsproject.org/materials/summary/"


class MaterialsProjectConnector(DatasetConnector):
    """Fetches data from the Materials Project API (v2).

    Requires an API key from https://materialsproject.org/api
    Set via config.api_key or MATERIALS_PROJECT_API_KEY env var.
    """

    def __init__(self, config: Optional[ConnectorConfig] = None) -> None:
        cfg = config or ConnectorConfig(base_url=MP_BASE_URL)
        if not cfg.base_url:
            cfg.base_url = MP_BASE_URL
        super().__init__(cfg)

        if not self.config.api_key:
            self.config.api_key = os.environ.get("MATERIALS_PROJECT_API_KEY", "")

    def search(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
        max_results: int = 100,
    ) -> list[DatasetEntry]:
        """Search Materials Project for materials."""
        params: dict[str, str] = {
            "_limit": str(min(max_results, self.config.max_results)),
            "_fields": "material_id,formula_pretty,formation_energy_per_atom,band_gap,energy_above_hull,density",
        }

        if elements:
            params["elements"] = ",".join(elements)
        if formula:
            params["formula"] = formula

        url = f"{self.config.base_url}?{urlencode(params)}"
        req = Request(url)
        if self.config.api_key:
            req.add_header("X-API-KEY", self.config.api_key)
        req.add_header("Accept", "application/json")

        try:
            with urlopen(req, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except URLError as e:
            logger.error(f"Materials Project API error: {e}")
            return []

        entries = []
        for item in data.get("data", []):
            entries.append(
                DatasetEntry(
                    external_id=item.get("material_id", ""),
                    formula=item.get("formula_pretty", ""),
                    properties={
                        "formation_energy": item.get(
                            "formation_energy_per_atom", 0.0
                        ),
                        "band_gap": item.get("band_gap", 0.0),
                        "energy_above_hull": item.get("energy_above_hull", 0.0),
                        "density": item.get("density", 0.0),
                    },
                    structure={},
                    source_db="materials_project",
                )
            )
        return entries

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single material by MP ID (e.g., 'mp-149')."""
        params = {
            "_fields": "material_id,formula_pretty,formation_energy_per_atom,band_gap,energy_above_hull,density",
        }
        url = f"{self.config.base_url}{external_id}/?{urlencode(params)}"
        req = Request(url)
        if self.config.api_key:
            req.add_header("X-API-KEY", self.config.api_key)
        req.add_header("Accept", "application/json")

        with urlopen(req, timeout=self.config.timeout) as response:
            data = json.loads(response.read().decode())

        item = data.get("data", [{}])[0] if data.get("data") else {}
        return DatasetEntry(
            external_id=item.get("material_id", external_id),
            formula=item.get("formula_pretty", ""),
            properties={
                "formation_energy": item.get("formation_energy_per_atom", 0.0),
                "band_gap": item.get("band_gap", 0.0),
                "energy_above_hull": item.get("energy_above_hull", 0.0),
                "density": item.get("density", 0.0),
            },
            structure={},
            source_db="materials_project",
        )
