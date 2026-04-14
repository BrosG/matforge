"""Shared base for DFT evaluator connectors."""

from __future__ import annotations

import logging
import subprocess
from abc import abstractmethod
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

from materia.evaluate.base import Evaluator
from materia.exceptions import MateriaEvalError
from materia.material import Material
from materia.mdl import MaterialDef
from materia.types import MaterialSource

logger = logging.getLogger(__name__)


@dataclass
class DFTConfig:
    """Shared configuration for DFT evaluators."""

    executable: str = ""
    work_dir: str = "dft_calcs"
    timeout_seconds: int = 3600
    cleanup: bool = True
    mpi_command: str = ""  # e.g., "mpirun -np 4"
    extra_settings: dict = field(default_factory=dict)


class DFTEvaluator(Evaluator):
    """Abstract base for DFT tool evaluators.

    Subclasses implement:
    - generate_input(): create input files from Material
    - run_calculation(): execute the DFT code
    - parse_output(): extract properties from output files
    """

    def __init__(self, config: DFTConfig | None = None) -> None:
        self.config = config or DFTConfig()

    def evaluate(self, params: np.ndarray, material_def: MaterialDef) -> Material:
        """Full DFT evaluation pipeline: generate -> run -> parse."""
        physical_values = {}
        for i, p_def in enumerate(material_def.parameters):
            lo, hi = p_def.range
            physical_values[p_def.name] = lo + float(params[i]) * (hi - lo)

        calc_id = abs(hash(tuple(params.tolist()))) % (10**12)
        calc_dir = Path(self.config.work_dir) / f"calc_{calc_id}"
        calc_dir.mkdir(parents=True, exist_ok=True)

        try:
            self.generate_input(physical_values, material_def, calc_dir)
            self.run_calculation(calc_dir)
            properties = self.parse_output(material_def, calc_dir)
        except Exception as e:
            raise MateriaEvalError(f"DFT calculation failed: {e}") from e

        # Compute score
        score = 0.0
        for obj in material_def.objectives:
            val = properties.get(obj.name, 0.0)
            if obj.direction.value == "maximize":
                score -= obj.weight * val
            else:
                score += obj.weight * val
        score /= max(1, len(material_def.objectives))

        return Material(
            params=params.copy(),
            properties=properties,
            score=score,
            source=MaterialSource.PHYSICS,
            metadata={"dft_dir": str(calc_dir)},
        )

    @abstractmethod
    def generate_input(
        self,
        physical_values: dict[str, float],
        material_def: MaterialDef,
        calc_dir: Path,
    ) -> None:
        """Generate DFT input files in calc_dir."""
        ...

    @abstractmethod
    def run_calculation(self, calc_dir: Path) -> None:
        """Execute the DFT calculation."""
        ...

    @abstractmethod
    def parse_output(
        self, material_def: MaterialDef, calc_dir: Path
    ) -> dict[str, float]:
        """Parse DFT output files and return property values."""
        ...

    def _run_command(self, cmd: str, calc_dir: Path) -> subprocess.CompletedProcess:
        """Execute a shell command with timeout."""
        full_cmd = f"{self.config.mpi_command} {cmd}".strip()
        return subprocess.run(
            full_cmd,
            shell=True,
            cwd=str(calc_dir),
            capture_output=True,
            text=True,
            timeout=self.config.timeout_seconds,
        )
