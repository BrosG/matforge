"""Water purification membrane physics models.

Simplified but physically-grounded analytical models for membrane
transport and rejection. These serve as the "true" evaluator.
"""

from __future__ import annotations

import numpy as np


def pfos_rejection(
    pore_diameter: float,
    active_layer_thickness: float,
    surface_charge_density: float,
    crosslink_density: float,
    **kwargs: float,
) -> float:
    """Donnan-steric pore model for PFOS rejection.

    Based on size exclusion (Ferry-Renkin) + charge exclusion (Donnan)
    + diffusion hindrance through the active layer.
    PFOS effective diameter ~ 0.55 nm.
    """
    pfos_diameter = 0.55  # nm

    # Size exclusion (Ferry-Renkin)
    ratio = pfos_diameter / pore_diameter
    if ratio >= 1.0:
        size_rejection = 1.0
    else:
        size_rejection = 1 - (1 - ratio) ** 2 * (2 - (1 - ratio) ** 2)

    # Charge exclusion (Donnan) - PFOS is anionic
    charge_factor = 1 - np.exp(surface_charge_density / 15)

    # Thickness effect (longer diffusion path = better rejection)
    thickness_factor = 1 - np.exp(-active_layer_thickness / 150)

    # Crosslinking reduces effective pore size
    crosslink_factor = 0.5 + 0.5 * crosslink_density

    rejection = (
        100 * size_rejection * charge_factor * thickness_factor * crosslink_factor
    )
    return float(np.clip(rejection, 0, 99.9))


def permeability(
    pore_diameter: float,
    active_layer_thickness: float,
    crosslink_density: float,
    hydrophilicity: float,
    **kwargs: float,
) -> float:
    """Hagen-Poiseuille based permeability model.

    Adapted for nanoscale pores with porosity and wetting corrections.
    Returns LMH/bar (liters per square meter per hour per bar).
    """
    viscosity_factor = 8e-4  # Pa.s (water at 25C)
    base_flux = (pore_diameter * 1e-9) ** 2 / (
        8 * viscosity_factor * active_layer_thickness * 1e-9
    )

    # Porosity (inversely related to crosslinking)
    porosity = 0.1 + 0.6 * (1 - crosslink_density)

    # Wetting factor from contact angle
    cos_theta = np.cos(np.radians(hydrophilicity))
    wetting_factor = max(0.1, (1 + cos_theta) / 2)

    # Convert to LMH/bar
    flux_lmh = base_flux * porosity * wetting_factor * 3.6e12

    return float(np.clip(flux_lmh, 0.01, 500.0))


def fouling_resistance(
    surface_charge_density: float,
    crosslink_density: float,
    hydrophilicity: float,
    **kwargs: float,
) -> float:
    """Fouling resistance score (0-100).

    Higher hydrophilicity, higher surface charge, and higher crosslinking
    all improve fouling resistance.
    """
    hydrophilic_score = (90 - hydrophilicity) / 70
    charge_score = abs(surface_charge_density) / 50
    crosslink_score = crosslink_density

    score = (hydrophilic_score * 0.4 + charge_score * 0.3 + crosslink_score * 0.3) * 100
    return float(np.clip(score, 0, 100))


# Registry for equation-string resolution
WATER_EQUATIONS = {
    "water.pfos_rejection": pfos_rejection,
    "water.permeability": permeability,
    "water.fouling_resistance": fouling_resistance,
}
