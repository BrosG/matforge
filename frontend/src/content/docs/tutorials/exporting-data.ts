import { DocPage } from "../index";

const page: DocPage = {
  slug: "exporting-data",
  title: "Exporting Data for DFT",
  description: "Download structure files in CIF and POSCAR format for use with VASP, Quantum ESPRESSO, and other codes.",
  category: "tutorials",
  order: 7,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "export", "dft", "vasp", "quantum-espresso"],
  readingTime: 5,
  body: `
## Exporting Data for DFT

MatCraft makes it easy to download crystal structures ready for DFT calculations. This tutorial covers exporting structures and preparing input files for VASP and Quantum ESPRESSO.

### Exporting from the Web UI

**Single material:**
1. Open the material detail page
2. Click **Download** on the Structure tab
3. Choose CIF, POSCAR, or XYZ format

**Batch export from search results:**
1. Run a search with your desired filters
2. Check the materials you want to export
3. Click **Export Selected** and choose the format
4. A ZIP file downloads containing all structure files

### Using the API for Bulk Export

For high-throughput screening, use the Python SDK:

\`\`\`python
from matcraft import MatCraftClient

client = MatCraftClient()

# Search for stable binary nitrides
materials = client.search(
    elements=["N"],
    n_elements_max=2,
    e_above_hull_max=0.05,
    limit=50
)

# Export all as POSCAR
for mat in materials:
    mat.export("poscar", path=f"structures/{mat.formula}_{mat.material_id}.vasp")
    print(f"Exported {mat.formula}")
\`\`\`

### Preparing VASP Input Files

The exported POSCAR is ready for VASP. You still need to create:

**INCAR** (calculation parameters):
\`\`\`
ENCUT = 520
EDIFF = 1E-6
ISMEAR = 0
SIGMA = 0.05
IBRION = 2
NSW = 100
ISIF = 3
\`\`\`

**KPOINTS** (k-mesh):
\`\`\`
Automatic mesh
0
Gamma
6 6 6
0 0 0
\`\`\`

**POTCAR**: Assemble from your VASP pseudopotential library based on the elements in the POSCAR.

### Preparing Quantum ESPRESSO Input

Convert the CIF file to QE format using \`cif2cell\` or the ASE toolkit:

\`\`\`python
from ase.io import read, write

atoms = read("Si_mp-149.cif")
write("Si.pwi", atoms, format="espresso-in",
      pseudopotentials={"Si": "Si.pbe-n-rrkjus_psl.1.0.0.UPF"},
      input_data={
          "system": {"ecutwfc": 60, "ecutrho": 480},
          "electrons": {"conv_thr": 1e-8},
      },
      kpts=(6, 6, 6))
\`\`\`

### Tips for DFT Calculations

- **Relax first**: Always run a geometry optimization before computing properties, even for structures from well-converged databases
- **Check convergence**: Test ENCUT and k-point mesh convergence for your specific system
- **Magnetic materials**: Set ISPIN=2 and initial magnetic moments for transition metal compounds
- **Band gaps**: Use HSE06 or GW methods for accurate band gaps; GGA/PBE systematically underestimates
- **Large cells**: For supercells or surfaces, reduce k-point density proportionally

### Jupyter Notebook Export

For reproducible workflows, export a Jupyter notebook that includes the complete pipeline from data retrieval to VASP input file preparation.
`,
};

export default page;
