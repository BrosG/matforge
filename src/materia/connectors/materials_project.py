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

    # All fields we request from MP v2 API
    _FIELDS = ",".join([
        "material_id", "formula_pretty",
        "formation_energy_per_atom", "band_gap", "energy_above_hull", "density",
        "volume", "is_stable",
        # Mechanical
        "bulk_modulus", "shear_modulus", "homogeneous_poisson",
        # Electronic
        "total_magnetization", "ordering",
        "e_electronic", "n",
        "is_gap_direct", "efermi",
        # Thermal
        "decomposes_to",
        # Structure
        "symmetry", "structure",
        # Provenance
        "theoretical", "oxidation_states",
        "database_IDs", "builder_meta",
    ])

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
            "_fields": self._FIELDS,
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
        req.add_header("User-Agent", "MatCraft/1.0 (materials discovery platform)")

        try:
            with urlopen(req, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except URLError as e:
            logger.error(f"Materials Project API error: {e}")
            return []

        entries = []
        for item in data.get("data", []):
            entries.append(self._parse_item(item))
        return entries

    def get_by_id(self, external_id: str) -> DatasetEntry:
        """Fetch a single material by MP ID (e.g., 'mp-149')."""
        params = {"_fields": self._FIELDS}
        url = f"{self.config.base_url}{external_id}/?{urlencode(params)}"
        req = Request(url)
        if self.config.api_key:
            req.add_header("X-API-KEY", self.config.api_key)
        req.add_header("Accept", "application/json")
        req.add_header("User-Agent", "MatCraft/1.0 (materials discovery platform)")

        with urlopen(req, timeout=self.config.timeout) as response:
            data = json.loads(response.read().decode())

        item = data.get("data", [{}])[0] if data.get("data") else {}
        return self._parse_item(item, fallback_id=external_id)

    @staticmethod
    def _parse_item(item: dict, fallback_id: str = "") -> DatasetEntry:
        """Parse a single MP API response item into a DatasetEntry."""
        properties: dict[str, float] = {}

        # Core thermodynamic
        for src, dst in [
            ("formation_energy_per_atom", "formation_energy"),
            ("band_gap", "band_gap"),
            ("energy_above_hull", "energy_above_hull"),
            ("density", "density"),
            ("volume", "volume"),
        ]:
            val = item.get(src)
            if val is not None and isinstance(val, (int, float)):
                properties[dst] = float(val)

        # Mechanical (MP returns nested dicts for elastic)
        bulk = item.get("bulk_modulus")
        if isinstance(bulk, dict):
            val = bulk.get("voigt_reuss_hill") or bulk.get("vrh")
            if val is not None:
                properties["bulk_modulus"] = float(val)
        elif isinstance(bulk, (int, float)):
            properties["bulk_modulus"] = float(bulk)

        shear = item.get("shear_modulus")
        if isinstance(shear, dict):
            val = shear.get("voigt_reuss_hill") or shear.get("vrh")
            if val is not None:
                properties["shear_modulus"] = float(val)
        elif isinstance(shear, (int, float)):
            properties["shear_modulus"] = float(shear)

        poisson = item.get("homogeneous_poisson")
        if poisson is not None and isinstance(poisson, (int, float)):
            properties["poisson_ratio"] = float(poisson)

        # Derive Young's modulus: E = 9KG / (3K + G)
        if "bulk_modulus" in properties and "shear_modulus" in properties:
            k, g = properties["bulk_modulus"], properties["shear_modulus"]
            if (3 * k + g) > 0:
                properties["young_modulus"] = 9 * k * g / (3 * k + g)

        # Magnetic
        mag = item.get("total_magnetization")
        if mag is not None and isinstance(mag, (int, float)):
            properties["total_magnetization"] = float(mag)

        # Electronic
        dielectric = item.get("e_electronic")
        if dielectric is not None and isinstance(dielectric, (int, float)):
            properties["dielectric_constant"] = float(dielectric)

        refr = item.get("n")
        if refr is not None and isinstance(refr, (int, float)):
            properties["refractive_index"] = float(refr)

        # Metadata
        metadata: dict = {}
        ordering = item.get("ordering")
        if ordering:
            metadata["magnetic_ordering"] = str(ordering)

        symmetry = item.get("symmetry")
        if isinstance(symmetry, dict):
            metadata["space_group"] = symmetry.get("symbol", "")
            metadata["crystal_system"] = symmetry.get("crystal_system", "")

        ox_states = item.get("oxidation_states")
        if ox_states:
            metadata["oxidation_states"] = ox_states

        if item.get("theoretical") is not None:
            metadata["is_theoretical"] = bool(item["theoretical"])

        metadata["is_stable"] = bool(item.get("is_stable", False))

        # DFT functional from builder_meta
        builder = item.get("builder_meta")
        if isinstance(builder, dict):
            metadata["calculation_method"] = builder.get("run_type", "GGA-PBE")
        else:
            metadata["calculation_method"] = "GGA-PBE"

        # Band gap type
        if item.get("is_gap_direct") is not None:
            metadata["is_gap_direct"] = bool(item["is_gap_direct"])

        # Fermi energy
        efermi = item.get("efermi")
        if efermi is not None and isinstance(efermi, (int, float)):
            properties["efermi"] = float(efermi)

        # Decomposition pathway
        decomp = item.get("decomposes_to")
        if decomp:
            metadata["decomposes_to"] = decomp

        # External database IDs (for citations/cross-references)
        db_ids = item.get("database_IDs")
        if isinstance(db_ids, dict):
            metadata["database_ids"] = db_ids
            # Extract ICSD IDs as experimental validation
            icsd = db_ids.get("icsd", [])
            if icsd:
                metadata["icsd_ids"] = icsd
                metadata["experimentally_observed"] = True
                metadata["is_theoretical"] = False

        return DatasetEntry(
            external_id=item.get("material_id", fallback_id),
            formula=item.get("formula_pretty", ""),
            properties=properties,
            structure=item.get("structure", {}),
            source_db="materials_project",
            metadata=metadata,
        )
