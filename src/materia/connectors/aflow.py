"""AFLOW database connector via REST API (aflowlib.org)."""

from __future__ import annotations

import json
import logging
from typing import Optional
from urllib.request import Request, urlopen

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)

AFLOW_BASE_URL = "http://aflowlib.org/API/aflux/"


class AflowConnector(DatasetConnector):
    """Fetches data from the AFLOW database. No API key required."""

    def __init__(self, config: Optional[ConnectorConfig] = None) -> None:
        cfg = config or ConnectorConfig(base_url=AFLOW_BASE_URL)
        if not cfg.base_url:
            cfg.base_url = AFLOW_BASE_URL
        super().__init__(cfg)

    def search(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
        max_results: int = 100,
    ) -> list[DatasetEntry]:
        """Search AFLOW using AFLUX query language."""
        matchbook = []
        if elements:
            matchbook.append(f"species({','.join(elements)})")
        if formula:
            matchbook.append(f"compound({formula})")

        paging = f"$paging(1,{min(max_results, 100)})"
        props = "auid,compound,enthalpy_formation_atom,Egap,density"
        query = ",".join(matchbook + [paging]) if matchbook else f"{paging}"
        url = f"{self.config.base_url}?{query},{props}"

        try:
            req = Request(url)
            req.add_header("Accept", "application/json")
            with urlopen(req, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except Exception as e:
            logger.error(f"AFLOW API error: {e}")
            return []

        entries = []
        items = data if isinstance(data, list) else []
        for item in items:
            entries.append(
                DatasetEntry(
                    external_id=item.get("auid", ""),
                    formula=item.get("compound", ""),
                    properties={
                        "formation_energy": _safe_float(
                            item.get("enthalpy_formation_atom")
                        ),
                        "band_gap": _safe_float(item.get("Egap")),
                        "density": _safe_float(item.get("density")),
                    },
                    structure={},
                    source_db="aflow",
                )
            )
        return entries

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single material by AFLOW UID."""
        url = f"{self.config.base_url}?auid('{external_id}'),compound,enthalpy_formation_atom,Egap,density"
        req = Request(url)
        with urlopen(req, timeout=self.config.timeout) as response:
            data = json.loads(response.read().decode())
        item = data[0] if isinstance(data, list) and data else {}
        return DatasetEntry(
            external_id=external_id,
            formula=item.get("compound", ""),
            properties={
                "formation_energy": _safe_float(
                    item.get("enthalpy_formation_atom")
                ),
                "band_gap": _safe_float(item.get("Egap")),
                "density": _safe_float(item.get("density")),
            },
            structure={},
            source_db="aflow",
        )


def _safe_float(val) -> float:
    """Convert a value to float safely."""
    try:
        return float(val) if val is not None else 0.0
    except (ValueError, TypeError):
        return 0.0
