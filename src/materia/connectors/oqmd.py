"""OQMD (Open Quantum Materials Database) connector via REST API."""

from __future__ import annotations

import json
import logging
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)

OQMD_BASE_URL = "http://oqmd.org/oqmdapi/formationenergy"


class OqmdConnector(DatasetConnector):
    """Fetches data from the OQMD database. No API key required."""

    def __init__(self, config: ConnectorConfig | None = None) -> None:
        cfg = config or ConnectorConfig(base_url=OQMD_BASE_URL)
        if not cfg.base_url:
            cfg.base_url = OQMD_BASE_URL
        super().__init__(cfg)

    def search(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
        max_results: int = 100,
    ) -> list[DatasetEntry]:
        """Search OQMD for materials."""
        params: dict[str, str] = {
            "limit": str(min(max_results, 100)),
            "fields": "entry_id,name,delta_e,band_gap,volume",
        }

        if elements:
            params["filter"] = " AND ".join(f"element={e}" for e in elements)
        if formula:
            params["filter"] = f"composition={formula}"

        url = f"{self.config.base_url}?{urlencode(params)}"

        try:
            req = Request(url)
            req.add_header("Accept", "application/json")
            with urlopen(req, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except Exception as e:
            logger.error(f"OQMD API error: {e}")
            return []

        entries = []
        for item in data.get("data", []):
            entries.append(
                DatasetEntry(
                    external_id=str(item.get("entry_id", "")),
                    formula=item.get("name", ""),
                    properties={
                        "formation_energy": _safe_float(item.get("delta_e")),
                        "band_gap": _safe_float(item.get("band_gap")),
                        "volume": _safe_float(item.get("volume")),
                    },
                    structure={},
                    source_db="oqmd",
                )
            )
        return entries

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single material by OQMD entry ID."""
        params = {
            "filter": f"entry_id={external_id}",
            "fields": "entry_id,name,delta_e,band_gap,volume",
        }
        url = f"{self.config.base_url}?{urlencode(params)}"
        req = Request(url)
        with urlopen(req, timeout=self.config.timeout) as response:
            data = json.loads(response.read().decode())
        items = data.get("data", [])
        item = items[0] if items else {}
        return DatasetEntry(
            external_id=external_id,
            formula=item.get("name", ""),
            properties={
                "formation_energy": _safe_float(item.get("delta_e")),
                "band_gap": _safe_float(item.get("band_gap")),
                "volume": _safe_float(item.get("volume")),
            },
            structure={},
            source_db="oqmd",
        )


def _safe_float(val) -> float:
    """Convert a value to float safely."""
    try:
        return float(val) if val is not None else 0.0
    except (ValueError, TypeError):
        return 0.0
