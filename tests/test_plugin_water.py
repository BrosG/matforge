"""Tests for the water domain plugin physics."""

import numpy as np
from materia.plugins.water.physics import (
    pfos_rejection,
    permeability,
    fouling_resistance,
)


def test_pfos_rejection_small_pore():
    """Smaller pores should give higher rejection."""
    rej_small = pfos_rejection(
        pore_diameter=0.6, active_layer_thickness=200,
        surface_charge_density=-30, crosslink_density=0.5,
    )
    rej_large = pfos_rejection(
        pore_diameter=4.0, active_layer_thickness=200,
        surface_charge_density=-30, crosslink_density=0.5,
    )
    assert rej_small > rej_large


def test_pfos_rejection_range():
    """Rejection should be in [0, 100]."""
    for _ in range(50):
        rng = np.random.default_rng(42)
        rej = pfos_rejection(
            pore_diameter=rng.uniform(0.5, 5.0),
            active_layer_thickness=rng.uniform(50, 500),
            surface_charge_density=rng.uniform(-50, 0),
            crosslink_density=rng.uniform(0.1, 0.9),
        )
        assert 0 <= rej <= 100


def test_permeability_larger_pore():
    """Larger pores should give higher permeability."""
    perm_small = permeability(
        pore_diameter=0.6, active_layer_thickness=200,
        crosslink_density=0.5, hydrophilicity=40,
    )
    perm_large = permeability(
        pore_diameter=4.0, active_layer_thickness=200,
        crosslink_density=0.5, hydrophilicity=40,
    )
    assert perm_large > perm_small


def test_permeability_positive():
    perm = permeability(
        pore_diameter=2.0, active_layer_thickness=200,
        crosslink_density=0.5, hydrophilicity=40,
    )
    assert perm > 0


def test_fouling_resistance_range():
    score = fouling_resistance(
        surface_charge_density=-25, crosslink_density=0.5, hydrophilicity=40,
    )
    assert 0 <= score <= 100


def test_fouling_resistance_hydrophilic():
    """Lower contact angle (more hydrophilic) should improve fouling resistance."""
    fr_hydrophilic = fouling_resistance(
        surface_charge_density=-25, crosslink_density=0.5, hydrophilicity=25,
    )
    fr_hydrophobic = fouling_resistance(
        surface_charge_density=-25, crosslink_density=0.5, hydrophilicity=80,
    )
    assert fr_hydrophilic > fr_hydrophobic
