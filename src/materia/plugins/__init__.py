"""Plugin registry and discovery for MATERIA domain plugins."""

from __future__ import annotations

from pathlib import Path

PLUGIN_REGISTRY: dict[str, Path] = {}


def discover_plugins() -> dict[str, Path]:
    """Discover all installed plugins by scanning the plugins directory."""
    plugins_dir = Path(__file__).parent
    PLUGIN_REGISTRY.clear()
    for child in plugins_dir.iterdir():
        if child.is_dir() and (child / "__init__.py").exists() and child.name != "__pycache__":
            PLUGIN_REGISTRY[child.name] = child
    return PLUGIN_REGISTRY


def get_plugin_template(domain: str) -> str:
    """Load the YAML template from a domain plugin."""
    discover_plugins()
    if domain not in PLUGIN_REGISTRY:
        available = list(PLUGIN_REGISTRY.keys())
        raise ValueError(f"Unknown domain '{domain}'. Available: {available}")

    yaml_path = PLUGIN_REGISTRY[domain] / "components.yaml"
    if not yaml_path.exists():
        raise FileNotFoundError(f"Plugin '{domain}' missing components.yaml")

    return yaml_path.read_text(encoding="utf-8")


def get_plugin_equations(domain: str) -> dict:
    """Load equation functions from a domain plugin's physics module."""
    discover_plugins()
    if domain not in PLUGIN_REGISTRY:
        return {}

    physics_path = PLUGIN_REGISTRY[domain] / "physics.py"
    if not physics_path.exists():
        return {}

    import importlib.util
    spec = importlib.util.spec_from_file_location(
        f"materia.plugins.{domain}.physics", physics_path
    )
    if spec is None or spec.loader is None:
        return {}

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    registry_name = f"{domain.upper()}_EQUATIONS"
    if hasattr(module, registry_name):
        return getattr(module, registry_name)
    return {}
