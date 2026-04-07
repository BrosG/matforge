"""JARVIS-DFT connector — NIST Joint Automated Repository for Various Integrated Simulations."""

from __future__ import annotations

import json
import logging
from typing import Optional
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)

JARVIS_BASE_URL = "https://jarvis.nist.gov/jarvisdft"


class JarvisConnector(DatasetConnector):
    """Fetches data from the JARVIS-DFT database (~80,000 materials).

    JARVIS (Joint Automated Repository for Various Integrated Simulations)
    is maintained by NIST and provides DFT-computed properties including
    formation energy, band gap, elastic moduli, and more.

    No API key required.
    """

    def __init__(self, config: Optional[ConnectorConfig] = None) -> None:
        cfg = config or ConnectorConfig(base_url=JARVIS_BASE_URL)
        if not cfg.base_url:
            cfg.base_url = JARVIS_BASE_URL
        super().__init__(cfg)

    def search(
        self,
        elements: list[str] | None = None,
        formula: str | None = None,
        property_range: dict[str, tuple[float, float]] | None = None,
        max_results: int = 100,
    ) -> list[DatasetEntry]:
        """Search JARVIS-DFT for materials."""
        params: dict[str, str] = {
            "limit": str(min(max_results, self.config.max_results)),
        }

        if elements:
            params["elements"] = ",".join(elements)
        if formula:
            params["formula"] = formula

        url = f"{self.config.base_url}/entries?{urlencode(params)}"
        req = Request(url)
        req.add_header("Accept", "application/json")

        try:
            with urlopen(req, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except URLError as e:
            logger.error(f"JARVIS API error: {e}")
            return []

        items = data if isinstance(data, list) else data.get("entries", data.get("data", []))

        entries: list[DatasetEntry] = []
        for item in items[:max_results]:
            jid = item.get("jid", item.get("id", ""))
            formula_str = item.get("formula", item.get("composition", ""))

            properties: dict[str, float] = {}
            prop_keys = {
                "formation_energy_peratom": "formation_energy",
                "optb88vdw_bandgap": "band_gap",
                "ehull": "energy_above_hull",
                "bulk_modulus_kv": "bulk_modulus",
                "shear_modulus_gv": "shear_modulus",
                "mbj_bandgap": "mbj_band_gap",
                "kpoint_length_unit": "kpoint_density",
                "density": "density",
                "total_energy": "total_energy",
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
                    external_id=str(jid),
                    formula=formula_str,
                    properties=properties,
                    structure=item.get("atoms", {}),
                    source_db="jarvis",
                )
            )
        return entries

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single material by JARVIS ID (e.g., 'JVASP-1002')."""
        url = f"{self.config.base_url}/entries/{external_id}"
        req = Request(url)
        req.add_header("Accept", "application/json")

        with urlopen(req, timeout=self.config.timeout) as response:
            data = json.loads(response.read().decode())

        item = data if isinstance(data, dict) else data[0] if data else {}

        properties: dict[str, float] = {}
        prop_keys = {
            "formation_energy_peratom": "formation_energy",
            "optb88vdw_bandgap": "band_gap",
            "ehull": "energy_above_hull",
            "bulk_modulus_kv": "bulk_modulus",
            "shear_modulus_gv": "shear_modulus",
            "density": "density",
        }
        for src_key, dst_key in prop_keys.items():
            val = item.get(src_key)
            if val is not None and isinstance(val, (int, float)):
                properties[dst_key] = float(val)

        return DatasetEntry(
            external_id=str(item.get("jid", external_id)),
            formula=item.get("formula", item.get("composition", "")),
            properties=properties,
            structure=item.get("atoms", {}),
            source_db="jarvis",
        )
