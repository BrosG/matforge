"""OPTIMADE universal connector — query 30+ materials databases with one API."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from urllib.error import URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)

# Major OPTIMADE-compliant providers
OPTIMADE_PROVIDERS: dict[str, str] = {
    "mp": "https://optimade.materialsproject.org",
    "aflow": "https://aflow.org/API/optimade",
    "oqmd": "https://oqmd.org/optimade",
    "mc3d": "https://aiida.materialscloud.org/mc3d/optimade",
    "cod": "https://www.crystallography.net/cod/optimade",
    "jarvis": "https://jarvis.nist.gov/optimade/jarvisdft",
    "alexandria": "https://alexandria.icams.rub.de/optimade",
    "mpds": "https://api.mpds.io/optimade",
    "tcod": "https://www.crystallography.net/tcod/optimade",
    "nmd": "https://nomad-lab.eu/prod/v1/api/optimade",
}


@dataclass
class OptimadeConfig(ConnectorConfig):
    """Configuration for OPTIMADE connector."""

    provider: str = "mp"


class OptimadeConnector(DatasetConnector):
    """Query any OPTIMADE-compliant materials database.

    OPTIMADE provides a standardised REST API across 30+ providers.
    See https://www.optimade.org for the specification.

    Usage:
        connector = OptimadeConnector(OptimadeConfig(provider="mp"))
        results = connector.search(elements=["Si", "O"], max_results=20)
    """

    def __init__(self, config: OptimadeConfig | None = None) -> None:
        cfg = config or OptimadeConfig()
        if not cfg.base_url:
            cfg.base_url = OPTIMADE_PROVIDERS.get(
                cfg.provider, OPTIMADE_PROVIDERS["mp"]
            )
        super().__init__(cfg)
        self._provider = getattr(cfg, "provider", "mp")

    def _build_filter(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
    ) -> str:
        """Build an OPTIMADE filter string."""
        parts: list[str] = []

        if elements:
            elem_list = ", ".join(f'"{e}"' for e in elements)
            parts.append(f"elements HAS ALL {elem_list}")

        if formula:
            parts.append(f'chemical_formula_reduced = "{formula}"')

        if property_range:
            prop_map = {
                "formation_energy": f"_{self._provider}_formation_energy_per_atom",
                "band_gap": f"_{self._provider}_band_gap",
                "energy_above_hull": f"_{self._provider}_energy_above_hull",
                "density": f"_{self._provider}_density",
            }
            for prop_name, (lo, hi) in property_range.items():
                optimade_field = prop_map.get(
                    prop_name, f"_{self._provider}_{prop_name}"
                )
                parts.append(f"{optimade_field} >= {lo}")
                parts.append(f"{optimade_field} <= {hi}")

        return " AND ".join(parts) if parts else ""

    def search(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
        max_results: int = 100,
    ) -> list[DatasetEntry]:
        """Search via OPTIMADE filter API."""
        filter_str = self._build_filter(elements, formula, property_range)

        params: dict[str, str] = {
            "page_limit": str(min(max_results, self.config.max_results)),
            "response_fields": "immutable_id,chemical_formula_reduced,elements,nelements",
        }
        if filter_str:
            params["filter"] = filter_str

        url = (
            f"{self.config.base_url}/v1/structures?{urlencode(params, quote_via=quote)}"
        )
        req = Request(url)
        req.add_header("Accept", "application/json")

        try:
            with urlopen(req, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except URLError as e:
            logger.error(f"OPTIMADE API error ({self._provider}): {e}")
            return []

        entries: list[DatasetEntry] = []
        for item in data.get("data", []):
            attrs = item.get("attributes", {})
            entry_id = attrs.get("immutable_id") or item.get("id", "")
            formula_str = attrs.get("chemical_formula_reduced", "")

            properties: dict[str, float] = {}
            for key, val in attrs.items():
                if key.startswith("_") and isinstance(val, (int, float)):
                    clean_key = key.lstrip("_")
                    if clean_key.startswith(f"{self._provider}_"):
                        clean_key = clean_key[len(self._provider) + 1 :]
                    properties[clean_key] = float(val)

            entries.append(
                DatasetEntry(
                    external_id=str(entry_id),
                    formula=formula_str,
                    properties=properties,
                    structure=attrs.get("cartesian_site_positions", {}),
                    source_db=f"optimade:{self._provider}",
                )
            )
        return entries

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single structure by its OPTIMADE ID."""
        url = f"{self.config.base_url}/v1/structures/{external_id}"
        req = Request(url)
        req.add_header("Accept", "application/json")

        with urlopen(req, timeout=self.config.timeout) as response:
            data = json.loads(response.read().decode())

        item = data.get("data", {})
        attrs = item.get("attributes", {})

        properties: dict[str, float] = {}
        for key, val in attrs.items():
            if key.startswith("_") and isinstance(val, (int, float)):
                clean_key = key.lstrip("_")
                if clean_key.startswith(f"{self._provider}_"):
                    clean_key = clean_key[len(self._provider) + 1 :]
                properties[clean_key] = float(val)

        return DatasetEntry(
            external_id=str(attrs.get("immutable_id") or item.get("id", external_id)),
            formula=attrs.get("chemical_formula_reduced", ""),
            properties=properties,
            structure=attrs.get("cartesian_site_positions", {}),
            source_db=f"optimade:{self._provider}",
        )
