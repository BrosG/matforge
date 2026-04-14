"""VASP DFT evaluator - generates POSCAR/INCAR/KPOINTS, runs vasp, parses OUTCAR."""

from __future__ import annotations

import re
from pathlib import Path

import numpy as np

from materia.evaluate.dft.base_dft import DFTConfig, DFTEvaluator
from materia.material import Material
from materia.mdl import MaterialDef


class VaspEvaluator(DFTEvaluator):
    """Evaluator that runs VASP calculations.

    Generates POSCAR, INCAR, KPOINTS, and POTCAR references.
    Parses OUTCAR for total energy, band gap, and other properties.
    """

    def __init__(self, config: DFTConfig | None = None) -> None:
        cfg = config or DFTConfig(executable="vasp_std")
        super().__init__(cfg)
        self.potcar_dir = cfg.extra_settings.get("potcar_dir", "")
        self.incar_template: dict = cfg.extra_settings.get("incar_template", {})

    def generate_input(
        self,
        physical_values: dict[str, float],
        material_def: MaterialDef,
        calc_dir: Path,
    ) -> None:
        """Generate POSCAR, INCAR, KPOINTS files."""
        from materia.io.poscar_writer import material_to_poscar

        params = []
        for p_def in material_def.parameters:
            lo, hi = p_def.range
            params.append((physical_values[p_def.name] - lo) / (hi - lo))

        composition = _extract_composition(physical_values, material_def)
        m = Material(params=np.array(params), composition=composition)

        poscar_str = material_to_poscar(m, material_def, title="VASP calc")
        (calc_dir / "POSCAR").write_text(poscar_str, encoding="utf-8")

        # INCAR
        incar_defaults = {
            "SYSTEM": material_def.name,
            "ENCUT": 520,
            "EDIFF": 1e-6,
            "ISMEAR": 0,
            "SIGMA": 0.05,
            "IBRION": 2,
            "NSW": 0,
            "PREC": "Accurate",
            "LWAVE": ".FALSE.",
            "LCHARG": ".FALSE.",
        }
        incar_defaults.update(self.incar_template)
        incar_lines = [f"{k} = {v}" for k, v in incar_defaults.items()]
        (calc_dir / "INCAR").write_text("\n".join(incar_lines), encoding="utf-8")

        # KPOINTS (Monkhorst-Pack)
        kpoints = "Automatic mesh\n0\nMonkhorst-Pack\n4 4 4\n0 0 0\n"
        (calc_dir / "KPOINTS").write_text(kpoints, encoding="utf-8")

    def run_calculation(self, calc_dir: Path) -> None:
        result = self._run_command(self.config.executable, calc_dir)
        if result.returncode != 0:
            raise RuntimeError(f"VASP failed: {result.stderr[:500]}")

    def parse_output(
        self, material_def: MaterialDef, calc_dir: Path
    ) -> dict[str, float]:
        """Parse OUTCAR for total energy and other properties."""
        outcar_path = calc_dir / "OUTCAR"
        if not outcar_path.exists():
            raise FileNotFoundError("OUTCAR not found")

        text = outcar_path.read_text(encoding="utf-8", errors="replace")
        properties: dict[str, float] = {}

        # Total energy
        energy_matches = re.findall(r"free  energy   TOTEN\s*=\s*([-\d.]+)\s*eV", text)
        if energy_matches:
            properties["total_energy"] = float(energy_matches[-1])

        # Band gap
        gap_match = re.search(r"band gap\s*[=:]\s*([\d.]+)\s*eV", text, re.IGNORECASE)
        if gap_match:
            properties["band_gap"] = float(gap_match.group(1))

        # Map to objective names
        obj_properties: dict[str, float] = {}
        for obj in material_def.objectives:
            if obj.name in properties:
                obj_properties[obj.name] = properties[obj.name]
            elif obj.equation and obj.equation in properties:
                obj_properties[obj.name] = properties[obj.equation]
            else:
                obj_properties[obj.name] = 0.0

        return obj_properties


def _extract_composition(
    physical_values: dict, material_def: MaterialDef
) -> dict[str, float]:
    """Extract composition from physical values if composition params exist."""
    if material_def.composition:
        total = sum(
            physical_values.get(c, 0) for c in material_def.composition.components
        )
        if total > 0:
            return {
                c: physical_values.get(c, 0) / total
                for c in material_def.composition.components
            }
    return {}
