"""Electronic structure endpoints: band structure, DOS, phonons.

Fetches on-demand from Materials Project via mp-api package
and returns plottable JSON for the frontend.
"""

from __future__ import annotations

import logging
import math
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)
router = APIRouter()

MP_API_KEY = os.environ.get("MATERIALS_PROJECT_API_KEY", "")


@router.get("/bandstructure/{mp_id}")
def get_bandstructure(mp_id: str):
    """Fetch band structure for an MP material and return plottable data.

    Returns: {efermi, bands: [{spin, energies: [[...]]}], branches: [{name, start, end}]}
    """
    if not mp_id.startswith("mp-"):
        raise HTTPException(status_code=400, detail="Only Materials Project IDs (mp-XXXX) supported")

    try:
        from mp_api.client import MPRester

        with MPRester(MP_API_KEY) as mpr:
            bs = mpr.get_bandstructure_by_material_id(mp_id)
    except ImportError:
        # Fallback: use REST API for metadata only
        return _bandstructure_metadata(mp_id)
    except Exception as e:
        logger.error("Failed to fetch band structure for %s: %s", mp_id, e)
        raise HTTPException(status_code=404, detail=f"Band structure not available for {mp_id}")

    if bs is None:
        raise HTTPException(status_code=404, detail=f"No band structure data for {mp_id}")

    # Extract plottable data
    result = {
        "material_id": mp_id,
        "efermi": float(bs.efermi),
        "is_metal": bs.is_metal(),
        "band_gap": {
            "energy": float(bs.get_band_gap()["energy"]),
            "direct": bs.get_band_gap()["direct"],
            "transition": bs.get_band_gap().get("transition", ""),
        },
        "bands": [],
        "kpoint_distances": [],
        "branches": [],
    }

    # K-point distances along the path
    distances = []
    d = 0.0
    prev_kpt = None
    for kpt in bs.kpoints:
        if prev_kpt is not None:
            dk = sum((a - b) ** 2 for a, b in zip(kpt.frac_coords, prev_kpt.frac_coords)) ** 0.5
            d += dk
        distances.append(d)
        prev_kpt = kpt
    result["kpoint_distances"] = [round(x, 6) for x in distances]

    # Branches (high-symmetry path segments)
    for branch in bs.branches:
        result["branches"].append({
            "name": branch["name"],
            "start_index": branch["start_index"],
            "end_index": branch["end_index"],
        })

    # Band energies per spin channel
    for spin, bands in bs.bands.items():
        spin_data = {
            "spin": str(spin),
            "energies": [],
        }
        for band in bands:
            spin_data["energies"].append([round(float(e) - bs.efermi, 6) for e in band])
        result["bands"].append(spin_data)

    return result


@router.get("/dos/{mp_id}")
def get_dos(mp_id: str):
    """Fetch density of states for an MP material and return plottable data."""
    if not mp_id.startswith("mp-"):
        raise HTTPException(status_code=400, detail="Only Materials Project IDs supported")

    try:
        from mp_api.client import MPRester

        with MPRester(MP_API_KEY) as mpr:
            dos = mpr.get_dos_by_material_id(mp_id)
    except ImportError:
        raise HTTPException(status_code=501, detail="mp-api package not installed")
    except Exception as e:
        logger.error("Failed to fetch DOS for %s: %s", mp_id, e)
        raise HTTPException(status_code=404, detail=f"DOS not available for {mp_id}")

    if dos is None:
        raise HTTPException(status_code=404, detail=f"No DOS data for {mp_id}")

    result = {
        "material_id": mp_id,
        "efermi": float(dos.efermi),
        "energies": [round(float(e) - dos.efermi, 6) for e in dos.energies],
        "total": {},
        "elemental": {},
    }

    # Total DOS per spin
    for spin, densities in dos.densities.items():
        result["total"][str(spin)] = [round(float(d), 6) for d in densities]

    # Element-projected DOS
    if hasattr(dos, 'get_element_dos') and callable(dos.get_element_dos):
        try:
            el_dos = dos.get_element_dos()
            for element, edos in el_dos.items():
                el_name = str(element)
                result["elemental"][el_name] = {}
                for spin, densities in edos.densities.items():
                    result["elemental"][el_name][str(spin)] = [round(float(d), 6) for d in densities]
        except Exception:
            pass

    return result


@router.get("/xrd/{mp_id}")
def get_xrd_pattern(
    mp_id: str,
    wavelength: float = Query(1.5406, description="X-ray wavelength in Angstrom (default: Cu K-alpha)"),
):
    """Simulate XRD pattern from crystal structure."""
    if not mp_id.startswith("mp-"):
        raise HTTPException(status_code=400, detail="Only Materials Project IDs supported")

    try:
        from mp_api.client import MPRester
        from pymatgen.analysis.diffraction.xrd import XRDCalculator

        with MPRester(MP_API_KEY) as mpr:
            structure = mpr.get_structure_by_material_id(mp_id)

        if structure is None:
            raise HTTPException(status_code=404, detail=f"No structure for {mp_id}")

        calc = XRDCalculator(wavelength=wavelength)
        pattern = calc.get_pattern(structure)

        return {
            "material_id": mp_id,
            "wavelength": wavelength,
            "two_theta": [round(float(x), 4) for x in pattern.x],
            "intensity": [round(float(y), 4) for y in pattern.y],
            "hkls": [
                {"hkl": list(hkl["hkl"]), "multiplicity": hkl.get("multiplicity", 1)}
                for hkl in pattern.hkls
            ] if hasattr(pattern, 'hkls') else [],
            "d_spacings": [round(float(d), 4) for d in pattern.d_hkls] if hasattr(pattern, 'd_hkls') else [],
        }
    except ImportError:
        raise HTTPException(status_code=501, detail="pymatgen not installed — XRD simulation requires pymatgen")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("XRD simulation failed for %s: %s", mp_id, e)
        raise HTTPException(status_code=500, detail=f"XRD simulation failed: {e}")


@router.get("/phase_diagram")
def get_phase_diagram(
    elements: str = Query(..., description="Comma-separated elements, e.g. 'Li,Fe,O'"),
):
    """Compute phase diagram for a set of elements."""
    el_list = [e.strip() for e in elements.split(",") if e.strip()]
    if len(el_list) < 2 or len(el_list) > 4:
        raise HTTPException(status_code=400, detail="Provide 2-4 elements")

    try:
        from mp_api.client import MPRester
        from pymatgen.analysis.phase_diagram import PhaseDiagram

        with MPRester(MP_API_KEY) as mpr:
            entries = mpr.get_entries_in_chemsys(el_list)

        if not entries:
            raise HTTPException(status_code=404, detail=f"No entries for {'-'.join(el_list)}")

        pd = PhaseDiagram(entries)

        # Extract stable entries and hull data
        stable = []
        for entry in pd.stable_entries:
            comp = entry.composition.reduced_formula
            stable.append({
                "formula": comp,
                "energy_per_atom": round(float(entry.energy_per_atom), 6),
                "composition": {str(el): round(float(amt), 4) for el, amt in entry.composition.fractional_composition.items()},
            })

        unstable = []
        for entry in pd.unstable_entries:
            comp = entry.composition.reduced_formula
            ehull = round(float(pd.get_e_above_hull(entry)), 6)
            unstable.append({
                "formula": comp,
                "energy_per_atom": round(float(entry.energy_per_atom), 6),
                "energy_above_hull": ehull,
                "composition": {str(el): round(float(amt), 4) for el, amt in entry.composition.fractional_composition.items()},
            })

        return {
            "elements": el_list,
            "n_entries": len(entries),
            "stable_phases": stable,
            "unstable_phases": unstable[:100],  # Cap to avoid huge response
        }
    except ImportError:
        raise HTTPException(status_code=501, detail="pymatgen + mp-api required for phase diagrams")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Phase diagram failed for %s: %s", elements, e)
        raise HTTPException(status_code=500, detail=f"Phase diagram computation failed: {e}")


def _bandstructure_metadata(mp_id: str) -> dict:
    """Fallback: return band structure metadata without full band data."""
    import json
    from urllib.request import Request, urlopen

    url = f"https://api.materialsproject.org/materials/electronic_structure/?material_ids={mp_id}&_fields=material_id,band_gap,cbm,vbm,efermi,is_gap_direct,is_metal,nbands&_limit=1"
    req = Request(url)
    req.add_header("X-API-KEY", MP_API_KEY)
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", "MatCraft/1.0")

    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())

    items = data.get("data", [])
    if not items:
        raise HTTPException(status_code=404, detail=f"No electronic structure for {mp_id}")

    item = items[0]
    return {
        "material_id": mp_id,
        "efermi": item.get("efermi"),
        "is_metal": item.get("is_metal", False),
        "band_gap": {
            "energy": item.get("band_gap", 0),
            "direct": item.get("is_gap_direct", False),
        },
        "bands": [],  # No full band data without mp-api
        "kpoint_distances": [],
        "branches": [],
        "note": "Full band structure requires mp-api package. Only metadata available.",
    }


@router.get("/notebook/{mp_id}")
def generate_notebook(mp_id: str):
    """Generate a Jupyter notebook for reproducing material analysis."""
    from starlette.responses import Response

    if not mp_id.startswith("mp-"):
        raise HTTPException(status_code=400, detail="Only Materials Project IDs supported")

    notebook = {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.10.0"},
        },
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    f"# Material Analysis: {mp_id}\n",
                    f"Auto-generated by MatForge (matcraft.ai)\n\n",
                    "This notebook reproduces the material data shown on MatForge using the Materials Project API.",
                ],
            },
            {
                "cell_type": "code",
                "metadata": {},
                "source": [
                    "# Install dependencies\n",
                    "# !pip install mp-api pymatgen matplotlib\n\n",
                    "from mp_api.client import MPRester\n",
                    "import matplotlib.pyplot as plt\n",
                    "import json\n\n",
                    f'MP_ID = "{mp_id}"\n',
                    'API_KEY = "YOUR_MP_API_KEY"  # Get from materialsproject.org\n',
                ],
                "execution_count": None,
                "outputs": [],
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": ["## 1. Fetch Material Summary"],
            },
            {
                "cell_type": "code",
                "metadata": {},
                "source": [
                    "with MPRester(API_KEY) as mpr:\n",
                    "    doc = mpr.summary.get_data_by_id(MP_ID)\n\n",
                    "print(f'Formula: {doc.formula_pretty}')\n",
                    "print(f'Band gap: {doc.band_gap} eV')\n",
                    "print(f'Formation energy: {doc.formation_energy_per_atom} eV/atom')\n",
                    "print(f'Energy above hull: {doc.energy_above_hull} eV/atom')\n",
                    "print(f'Crystal system: {doc.symmetry.crystal_system}')\n",
                    "print(f'Space group: {doc.symmetry.symbol}')\n",
                    "print(f'Stable: {doc.is_stable}')\n",
                ],
                "execution_count": None,
                "outputs": [],
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": ["## 2. Crystal Structure"],
            },
            {
                "cell_type": "code",
                "metadata": {},
                "source": [
                    "with MPRester(API_KEY) as mpr:\n",
                    "    structure = mpr.get_structure_by_material_id(MP_ID)\n\n",
                    "print(structure)\n",
                    "print(f'\\nLattice: {structure.lattice}')\n",
                    "print(f'Volume: {structure.volume:.2f} A^3')\n",
                ],
                "execution_count": None,
                "outputs": [],
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": ["## 3. Band Structure"],
            },
            {
                "cell_type": "code",
                "metadata": {},
                "source": [
                    "from pymatgen.electronic_structure.plotter import BSPlotter\n\n",
                    "with MPRester(API_KEY) as mpr:\n",
                    "    bs = mpr.get_bandstructure_by_material_id(MP_ID)\n\n",
                    "if bs:\n",
                    "    plotter = BSPlotter(bs)\n",
                    "    plotter.get_plot(ylim=(-5, 5))\n",
                    "    plt.title(f'Band Structure - {MP_ID}')\n",
                    "    plt.savefig(f'{MP_ID}_bandstructure.png', dpi=300, bbox_inches='tight')\n",
                    "    plt.show()\n",
                    "else:\n",
                    "    print('No band structure available')\n",
                ],
                "execution_count": None,
                "outputs": [],
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": ["## 4. Density of States"],
            },
            {
                "cell_type": "code",
                "metadata": {},
                "source": [
                    "from pymatgen.electronic_structure.plotter import DosPlotter\n\n",
                    "with MPRester(API_KEY) as mpr:\n",
                    "    dos = mpr.get_dos_by_material_id(MP_ID)\n\n",
                    "if dos:\n",
                    "    plotter = DosPlotter()\n",
                    "    plotter.add_dos('Total', dos)\n",
                    "    plotter.get_plot(xlim=(-5, 5))\n",
                    "    plt.title(f'Density of States - {MP_ID}')\n",
                    "    plt.savefig(f'{MP_ID}_dos.png', dpi=300, bbox_inches='tight')\n",
                    "    plt.show()\n",
                    "else:\n",
                    "    print('No DOS available')\n",
                ],
                "execution_count": None,
                "outputs": [],
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": ["## 5. XRD Pattern"],
            },
            {
                "cell_type": "code",
                "metadata": {},
                "source": [
                    "from pymatgen.analysis.diffraction.xrd import XRDCalculator\n\n",
                    "calc = XRDCalculator()\n",
                    "pattern = calc.get_pattern(structure)\n\n",
                    "plt.figure(figsize=(10, 4))\n",
                    "plt.stem(pattern.x, pattern.y, markerfmt=' ', basefmt=' ')\n",
                    "plt.xlabel('2\\u03B8 (degrees)')\n",
                    "plt.ylabel('Intensity')\n",
                    "plt.title(f'Simulated XRD - {MP_ID}')\n",
                    "plt.savefig(f'{MP_ID}_xrd.png', dpi=300, bbox_inches='tight')\n",
                    "plt.show()\n",
                ],
                "execution_count": None,
                "outputs": [],
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "---\n",
                    f"*Generated by [MatForge](https://matcraft.ai/materials/{mp_id})*\n",
                    "*Cite: A. Jain et al., APL Materials 1, 011002 (2013). DOI: 10.1063/1.4812323*",
                ],
            },
        ],
    }

    content = json.dumps(notebook, indent=2)
    return Response(
        content=content,
        media_type="application/x-ipynb+json",
        headers={"Content-Disposition": f"attachment; filename={mp_id}_analysis.ipynb"},
    )
