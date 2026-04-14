"""AFLOW database connector via REST API (aflowlib.org)."""

from __future__ import annotations

import json
import logging
from urllib.request import Request, urlopen

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry

logger = logging.getLogger(__name__)

AFLOW_BASE_URL = "http://aflowlib.org/API/aflux/"


class AflowConnector(DatasetConnector):
    """Fetches data from the AFLOW database. No API key required."""

    def __init__(self, config: ConnectorConfig | None = None) -> None:
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
        props = (
            "auid,compound,enthalpy_formation_atom,Egap,density,"
            "ael_bulk_modulus_vrh,ael_shear_modulus_vrh,ael_poisson_ratio,"
            "ael_youngs_modulus_vrh,"
            "agl_thermal_conductivity_300K,agl_debye,"
            "spin_atom,Bravais_lattice_orig,spacegroup_relax"
        )
        query = ",".join(matchbook + [paging]) if matchbook else f"{paging}"
        url = f"{self.config.base_url}?{query},{props}"

        try:
            req = Request(url)
            req.add_header("Accept", "application/json")
            req.add_header("User-Agent", "MatCraft/1.0")
            with urlopen(req, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except Exception as e:
            logger.error(f"AFLOW API error: {e}")
            return []

        entries = []
        items = data if isinstance(data, list) else []
        for item in items:
            entries.append(self._parse_item(item))
        return entries

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single material by AFLOW UID."""
        props = (
            "compound,enthalpy_formation_atom,Egap,density,"
            "ael_bulk_modulus_vrh,ael_shear_modulus_vrh,ael_poisson_ratio,"
            "ael_youngs_modulus_vrh,"
            "agl_thermal_conductivity_300K,agl_debye,"
            "spin_atom,Bravais_lattice_orig,spacegroup_relax"
        )
        url = f"{self.config.base_url}?auid('{external_id}'),{props}"
        req = Request(url)
        with urlopen(req, timeout=self.config.timeout) as response:
            data = json.loads(response.read().decode())
        item = data[0] if isinstance(data, list) and data else {}
        return self._parse_item(item, fallback_id=external_id)

    @staticmethod
    def _parse_item(item: dict, fallback_id: str = "") -> DatasetEntry:
        properties: dict[str, float] = {}
        prop_map = {
            "enthalpy_formation_atom": "formation_energy",
            "Egap": "band_gap",
            "density": "density",
            "ael_bulk_modulus_vrh": "bulk_modulus",
            "ael_shear_modulus_vrh": "shear_modulus",
            "ael_poisson_ratio": "poisson_ratio",
            "ael_youngs_modulus_vrh": "young_modulus",
            "agl_thermal_conductivity_300K": "thermal_conductivity",
            "spin_atom": "total_magnetization",
        }
        for src_key, dst_key in prop_map.items():
            val = item.get(src_key)
            if val is not None:
                fval = _safe_float(val)
                if fval != 0.0 or src_key in ("Egap", "spin_atom"):
                    properties[dst_key] = fval

        metadata: dict = {}
        sg = item.get("spacegroup_relax")
        if sg:
            metadata["space_group"] = str(sg)
        bravais = item.get("Bravais_lattice_orig")
        if bravais:
            metadata["crystal_system"] = str(bravais).lower()
        metadata["calculation_method"] = "GGA-PBE"  # AFLOW default

        return DatasetEntry(
            external_id=item.get("auid", fallback_id),
            formula=item.get("compound", ""),
            properties=properties,
            structure={},
            source_db="aflow",
            metadata=metadata,
        )


def _safe_float(val) -> float:
    """Convert a value to float safely."""
    try:
        return float(val) if val is not None else 0.0
    except (ValueError, TypeError):
        return 0.0
