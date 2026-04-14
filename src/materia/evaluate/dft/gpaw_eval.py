"""GPAW evaluator - generates Python script, runs via gpaw-python."""

from __future__ import annotations

import json
from pathlib import Path

from materia.evaluate.dft.base_dft import DFTConfig, DFTEvaluator
from materia.mdl import MaterialDef


class GpawEvaluator(DFTEvaluator):
    """Evaluator that runs GPAW calculations via generated Python scripts."""

    def __init__(self, config: DFTConfig | None = None) -> None:
        cfg = config or DFTConfig(executable="gpaw python")
        super().__init__(cfg)
        self.xc = cfg.extra_settings.get("xc", "PBE")
        self.ecut = cfg.extra_settings.get("ecut", 350)
        self.kpts = cfg.extra_settings.get("kpts", (4, 4, 4))

    def generate_input(
        self,
        physical_values: dict[str, float],
        material_def: MaterialDef,
        calc_dir: Path,
    ) -> None:
        """Generate a GPAW Python calculation script."""
        a = physical_values.get("a", 5.0)

        elements = []
        if material_def.composition:
            elements = material_def.composition.components
        if not elements:
            elements = sorted((material_def.metadata or {}).get("elements", ["H", "H"]))

        kpts_str = repr(tuple(self.kpts) if isinstance(self.kpts, list) else self.kpts)
        elem_str = repr(elements)

        script = f'''\
"""Auto-generated GPAW calculation script."""
import json
from ase import Atoms
from ase.build import bulk
from gpaw import GPAW, PW

# Build structure
elements = {elem_str}
atoms = bulk(elements[0], 'fcc', a={a:.4f}) if len(elements) == 1 else Atoms(
    symbols="".join(elements),
    positions=[[0, 0, 0]] + [[{a / 2:.4f}, {a / 2:.4f}, 0]] * (len(elements) - 1),
    cell=[{a:.4f}, {a:.4f}, {a:.4f}],
    pbc=True,
)

calc = GPAW(
    mode=PW({self.ecut}),
    xc="{self.xc}",
    kpts={kpts_str},
    txt="gpaw.txt",
)
atoms.calc = calc

energy = atoms.get_potential_energy()
forces = atoms.get_forces()

results = {{
    "total_energy": float(energy),
    "max_force": float(abs(forces).max()),
    "energy_per_atom": float(energy / len(atoms)),
}}

with open("results.json", "w") as f:
    json.dump(results, f, indent=2)
'''
        (calc_dir / "calc.py").write_text(script, encoding="utf-8")

    def run_calculation(self, calc_dir: Path) -> None:
        result = self._run_command(f"{self.config.executable} calc.py", calc_dir)
        if result.returncode != 0:
            raise RuntimeError(f"GPAW failed: {result.stderr[:500]}")

    def parse_output(
        self, material_def: MaterialDef, calc_dir: Path
    ) -> dict[str, float]:
        """Parse results.json written by the GPAW script."""
        results_path = calc_dir / "results.json"
        if not results_path.exists():
            raise FileNotFoundError("GPAW results.json not found")
        data = json.loads(results_path.read_text(encoding="utf-8"))
        return {obj.name: data.get(obj.name, 0.0) for obj in material_def.objectives}
