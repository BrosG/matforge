"""Tests for extended dataset connectors: OPTIMADE, JARVIS, Perovskite, GNoME, OpenDAC."""

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from materia.connectors.base import DatasetEntry


# ---------- OPTIMADE ----------

class TestOptimadeConnector:
    def test_import(self):
        from materia.connectors.optimade import OptimadeConnector, OptimadeConfig
        assert OptimadeConnector is not None
        assert OptimadeConfig is not None

    def test_default_config(self):
        from materia.connectors.optimade import OptimadeConnector, OptimadeConfig
        connector = OptimadeConnector()
        assert "materialsproject" in connector.config.base_url

    def test_custom_provider(self):
        from materia.connectors.optimade import OptimadeConnector, OptimadeConfig
        connector = OptimadeConnector(OptimadeConfig(provider="aflow"))
        assert "aflow" in connector.config.base_url

    def test_build_filter_elements(self):
        from materia.connectors.optimade import OptimadeConnector
        connector = OptimadeConnector()
        filt = connector._build_filter(elements=["Fe", "O"])
        assert 'elements HAS ALL "Fe", "O"' in filt

    def test_build_filter_formula(self):
        from materia.connectors.optimade import OptimadeConnector
        connector = OptimadeConnector()
        filt = connector._build_filter(formula="Fe2O3")
        assert 'chemical_formula_reduced = "Fe2O3"' in filt

    def test_build_filter_combined(self):
        from materia.connectors.optimade import OptimadeConnector
        connector = OptimadeConnector()
        filt = connector._build_filter(
            elements=["Si"],
            property_range={"band_gap": (1.0, 3.0)}
        )
        assert "elements HAS ALL" in filt
        assert "band_gap" in filt
        assert ">= 1.0" in filt
        assert "<= 3.0" in filt

    @patch("materia.connectors.optimade.urlopen")
    def test_search_parses_response(self, mock_urlopen):
        from materia.connectors.optimade import OptimadeConnector
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "data": [
                {
                    "id": "mp-149",
                    "attributes": {
                        "immutable_id": "mp-149",
                        "chemical_formula_reduced": "Si",
                        "_mp_band_gap": 1.12,
                        "_mp_formation_energy_per_atom": -0.0066,
                    }
                }
            ]
        }).encode()
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        connector = OptimadeConnector()
        results = connector.search(elements=["Si"], max_results=10)

        assert len(results) == 1
        assert results[0].external_id == "mp-149"
        assert results[0].formula == "Si"
        assert isinstance(results[0], DatasetEntry)
        assert results[0].source_db.startswith("optimade:")

    @patch("materia.connectors.optimade.urlopen")
    def test_search_handles_api_error(self, mock_urlopen):
        from urllib.error import URLError
        from materia.connectors.optimade import OptimadeConnector
        mock_urlopen.side_effect = URLError("Connection refused")

        connector = OptimadeConnector()
        results = connector.search(elements=["Fe"])
        assert results == []


# ---------- JARVIS ----------

class TestJarvisConnector:
    def test_import(self):
        from materia.connectors.jarvis import JarvisConnector
        assert JarvisConnector is not None

    @patch("materia.connectors.jarvis.urlopen")
    def test_search_maps_properties(self, mock_urlopen):
        from materia.connectors.jarvis import JarvisConnector
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps([
            {
                "jid": "JVASP-1002",
                "formula": "Si",
                "formation_energy_peratom": -0.006,
                "optb88vdw_bandgap": 1.12,
                "ehull": 0.0,
                "bulk_modulus_kv": 98.5,
            }
        ]).encode()
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        connector = JarvisConnector()
        results = connector.search(elements=["Si"])

        assert len(results) == 1
        assert results[0].external_id == "JVASP-1002"
        assert results[0].properties["formation_energy"] == pytest.approx(-0.006)
        assert results[0].properties["band_gap"] == pytest.approx(1.12)
        assert results[0].properties["bulk_modulus"] == pytest.approx(98.5)
        assert results[0].source_db == "jarvis"

    @patch("materia.connectors.jarvis.urlopen")
    def test_search_filters_by_property_range(self, mock_urlopen):
        from materia.connectors.jarvis import JarvisConnector
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps([
            {"jid": "J1", "formula": "A", "optb88vdw_bandgap": 0.5},
            {"jid": "J2", "formula": "B", "optb88vdw_bandgap": 2.0},
            {"jid": "J3", "formula": "C", "optb88vdw_bandgap": 4.0},
        ]).encode()
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        connector = JarvisConnector()
        results = connector.search(property_range={"band_gap": (1.0, 3.0)})
        assert len(results) == 1
        assert results[0].external_id == "J2"


# ---------- Perovskite ----------

class TestPerovskiteConnector:
    def test_import(self):
        from materia.connectors.perovskite import PerovskiteConnector
        assert PerovskiteConnector is not None

    @patch("materia.connectors.perovskite.urlopen")
    def test_search_parses_response(self, mock_urlopen):
        from materia.connectors.perovskite import PerovskiteConnector
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps([
            {
                "id": "pvsk-001",
                "formula": "MAPbI3",
                "band_gap": 1.55,
                "pce": 22.1,
                "tolerance_factor": 0.91,
            }
        ]).encode()
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        connector = PerovskiteConnector()
        results = connector.search(formula="MAPbI3")

        assert len(results) == 1
        assert results[0].formula == "MAPbI3"
        assert results[0].properties["band_gap"] == pytest.approx(1.55)
        assert results[0].properties["pce"] == pytest.approx(22.1)
        assert results[0].source_db == "perovskite_db"


# ---------- GNoME ----------

class TestGnomeConnector:
    def _create_test_data(self, tmpdir: Path) -> Path:
        csv_path = tmpdir / "stable_materials_summary.csv"
        csv_path.write_text(
            "material_id,formula,formation_energy_per_atom,energy_above_hull,is_stable\n"
            "gnome-001,Si,0.0,0.0,1.0\n"
            "gnome-002,Fe2O3,-0.85,0.02,1.0\n"
            "gnome-003,GaN,-0.62,0.0,1.0\n"
            "gnome-004,TiO2,-3.2,0.0,1.0\n",
            encoding="utf-8",
        )
        return csv_path

    def test_import(self):
        from materia.connectors.gnome import GnomeConnector, GnomeConfig
        assert GnomeConnector is not None

    def test_search_local_csv(self):
        from materia.connectors.gnome import GnomeConnector, GnomeConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = GnomeConnector(GnomeConfig(data_dir=tmpdir))
            results = connector.search(max_results=10)
            assert len(results) == 4
            assert all(isinstance(r, DatasetEntry) for r in results)
            assert all(r.source_db == "gnome" for r in results)

    def test_search_by_elements(self):
        from materia.connectors.gnome import GnomeConnector, GnomeConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = GnomeConnector(GnomeConfig(data_dir=tmpdir))
            results = connector.search(elements=["Fe", "O"])
            assert len(results) == 1
            assert results[0].formula == "Fe2O3"

    def test_search_by_formula(self):
        from materia.connectors.gnome import GnomeConnector, GnomeConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = GnomeConnector(GnomeConfig(data_dir=tmpdir))
            results = connector.search(formula="TiO2")
            assert len(results) == 1
            assert results[0].external_id == "gnome-004"

    def test_search_by_property_range(self):
        from materia.connectors.gnome import GnomeConnector, GnomeConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = GnomeConnector(GnomeConfig(data_dir=tmpdir))
            results = connector.search(
                property_range={"formation_energy_per_atom": (-1.0, -0.5)}
            )
            assert len(results) == 2  # Fe2O3 and GaN

    def test_get_by_id(self):
        from materia.connectors.gnome import GnomeConnector, GnomeConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = GnomeConnector(GnomeConfig(data_dir=tmpdir))
            entry = connector.get_by_id("gnome-002")
            assert entry.formula == "Fe2O3"
            assert entry.properties["formation_energy_per_atom"] == pytest.approx(-0.85)

    def test_empty_data_dir(self):
        from materia.connectors.gnome import GnomeConnector, GnomeConfig
        connector = GnomeConnector(GnomeConfig(data_dir="/nonexistent/path"))
        results = connector.search(max_results=10)
        assert results == []


# ---------- OpenDAC ----------

class TestOpenDACConnector:
    def _create_test_data(self, tmpdir: Path) -> Path:
        json_path = tmpdir / "metadata.json"
        data = [
            {
                "system_id": "dac-001",
                "catalyst_formula": "Cu2O",
                "adsorbate": "CO2",
                "adsorption_energy": -1.2,
            },
            {
                "system_id": "dac-002",
                "catalyst_formula": "ZnO",
                "adsorbate": "H2O",
                "adsorption_energy": -0.8,
            },
            {
                "system_id": "dac-003",
                "catalyst_formula": "TiO2",
                "adsorbate": "CO2",
                "adsorption_energy": -2.1,
            },
        ]
        json_path.write_text(json.dumps(data), encoding="utf-8")
        return json_path

    def test_import(self):
        from materia.connectors.opendac import OpenDACConnector, OpenDACConfig
        assert OpenDACConnector is not None

    def test_search_local_json(self):
        from materia.connectors.opendac import OpenDACConnector, OpenDACConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = OpenDACConnector(OpenDACConfig(data_dir=tmpdir))
            results = connector.search(max_results=10)
            assert len(results) == 3
            assert all(r.source_db == "opendac" for r in results)

    def test_search_by_elements(self):
        from materia.connectors.opendac import OpenDACConnector, OpenDACConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = OpenDACConnector(OpenDACConfig(data_dir=tmpdir))
            results = connector.search(elements=["Cu"])
            assert len(results) == 1
            assert "Cu2O" in results[0].formula

    def test_search_by_property_range(self):
        from materia.connectors.opendac import OpenDACConnector, OpenDACConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = OpenDACConnector(OpenDACConfig(data_dir=tmpdir))
            results = connector.search(
                property_range={"adsorption_energy": (-1.5, -0.5)}
            )
            assert len(results) == 2  # dac-001 and dac-002

    def test_formula_includes_adsorbate(self):
        from materia.connectors.opendac import OpenDACConnector, OpenDACConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = OpenDACConnector(OpenDACConfig(data_dir=tmpdir))
            results = connector.search(max_results=1)
            assert "@" in results[0].formula  # CO2@Cu2O format

    def test_get_by_id(self):
        from materia.connectors.opendac import OpenDACConnector, OpenDACConfig
        with tempfile.TemporaryDirectory() as tmpdir:
            self._create_test_data(Path(tmpdir))
            connector = OpenDACConnector(OpenDACConfig(data_dir=tmpdir))
            entry = connector.get_by_id("dac-002")
            assert "ZnO" in entry.formula
            assert entry.properties["adsorption_energy"] == pytest.approx(-0.8)

    def test_empty_data_dir(self):
        from materia.connectors.opendac import OpenDACConnector, OpenDACConfig
        connector = OpenDACConnector(OpenDACConfig(data_dir="/nonexistent/path"))
        results = connector.search(max_results=10)
        assert results == []
