"""Quantum ESPRESSO evaluator - generates .in files, runs pw.x, parses output."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

from materia.evaluate.dft.base_dft import DFTConfig, DFTEvaluator
from materia.mdl import MaterialDef


class QuantumEspressoEvaluator(DFTEvaluator):
    """Evaluator that runs Quantum ESPRESSO pw.x calculations."""

    def __init__(self, config: Optional[DFTConfig] = None) -> None:
        cfg = config or DFTConfig(executable="pw.x")
        super().__init__(cfg)
        self.pseudo_dir = cfg.extra_settings.get("pseudo_dir", "./pseudo")
        self.ecutwfc = cfg.extra_settings.get("ecutwfc", 60.0)
        self.ecutrho = cfg.extra_settings.get("ecutrho", 480.0)

    def generate_input(
        self,
        physical_values: dict[str, float],
        material_def: MaterialDef,
        calc_dir: Path,
    ) -> None:
        """Generate pw.x input file (pw.in)."""
        a = physical_values.get("a", 5.0)
        b = physical_values.get("b", 5.0)
        c = physical_values.get("c", 5.0)

        elements = []
        if material_def.composition:
            elements = material_def.composition.components
        if not elements:
            elements = sorted(
                (material_def.metadata or {}).get("elements", ["X"])
            )

        nat = max(len(elements), 1)
        ntyp = nat

        lines = [
            "&CONTROL",
            f"  calculation = 'scf'",
            f"  prefix = '{material_def.name}'",
            f"  pseudo_dir = '{self.pseudo_dir}'",
            f"  outdir = './'",
            "/",
            "&SYSTEM",
            f"  ibrav = 0",
            f"  nat = {nat}",
            f"  ntyp = {ntyp}",
            f"  ecutwfc = {self.ecutwfc}",
            f"  ecutrho = {self.ecutrho}",
            "/",
            "&ELECTRONS",
            "  conv_thr = 1.0d-8",
            "/",
            "",
            "ATOMIC_SPECIES",
        ]

        for elem in elements:
            lines.append(f"  {elem}  1.0  {elem}.UPF")

        lines.append("")
        lines.append("ATOMIC_POSITIONS {crystal}")
        for i, elem in enumerate(elements):
            fx = (i + 0.5) / max(nat, 1)
            lines.append(f"  {elem}  {fx:.6f}  0.500000  0.500000")

        lines.append("")
        lines.append("K_POINTS {automatic}")
        lines.append("  4 4 4 0 0 0")

        lines.append("")
        lines.append("CELL_PARAMETERS {angstrom}")
        lines.append(f"  {a:.6f}  0.000000  0.000000")
        lines.append(f"  0.000000  {b:.6f}  0.000000")
        lines.append(f"  0.000000  0.000000  {c:.6f}")

        (calc_dir / "pw.in").write_text("\n".join(lines), encoding="utf-8")

    def run_calculation(self, calc_dir: Path) -> None:
        cmd = f"{self.config.executable} < pw.in > pw.out"
        result = self._run_command(cmd, calc_dir)
        if result.returncode != 0:
            raise RuntimeError(f"QE failed: {result.stderr[:500]}")

    def parse_output(
        self, material_def: MaterialDef, calc_dir: Path
    ) -> dict[str, float]:
        """Parse pw.out for total energy."""
        pw_out = calc_dir / "pw.out"
        if not pw_out.exists():
            raise FileNotFoundError("pw.out not found")

        text = pw_out.read_text(encoding="utf-8", errors="replace")
        properties: dict[str, float] = {}

        energy_match = re.search(r"!\s+total energy\s+=\s+([-\d.]+)\s+Ry", text)
        if energy_match:
            properties["total_energy"] = float(energy_match.group(1)) * 13.6057  # Ry -> eV

        fermi_match = re.search(r"the Fermi energy is\s+([-\d.]+)\s+ev", text, re.IGNORECASE)
        if fermi_match:
            properties["fermi_energy"] = float(fermi_match.group(1))

        return {obj.name: properties.get(obj.name, 0.0) for obj in material_def.objectives}
