"""Public dataset connectors for 8 materials databases."""

from materia.connectors.base import ConnectorConfig, DatasetConnector, DatasetEntry
from materia.connectors.materials_project import MaterialsProjectConnector
from materia.connectors.aflow import AflowConnector
from materia.connectors.oqmd import OqmdConnector
from materia.connectors.optimade import OptimadeConnector, OptimadeConfig
from materia.connectors.jarvis import JarvisConnector
from materia.connectors.perovskite import PerovskiteConnector
from materia.connectors.gnome import GnomeConnector, GnomeConfig
from materia.connectors.opendac import OpenDACConnector, OpenDACConfig

__all__ = [
    "DatasetConnector",
    "ConnectorConfig",
    "DatasetEntry",
    "MaterialsProjectConnector",
    "AflowConnector",
    "OqmdConnector",
    "OptimadeConnector",
    "OptimadeConfig",
    "JarvisConnector",
    "PerovskiteConnector",
    "GnomeConnector",
    "GnomeConfig",
    "OpenDACConnector",
    "OpenDACConfig",
]
