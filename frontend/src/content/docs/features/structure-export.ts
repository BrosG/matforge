import { DocPage } from "../index";

const page: DocPage = {
  slug: "structure-export",
  title: "Structure File Export",
  description: "Download crystal structures in CIF, POSCAR, and XYZ formats for DFT and simulation codes.",
  category: "features",
  order: 10,
  lastUpdated: "2026-04-10",
  tags: ["export", "cif", "poscar", "xyz", "download"],
  readingTime: 4,
  body: `
## Structure File Export

MatCraft supports exporting crystal structures in standard file formats used by DFT codes, molecular dynamics packages, and crystallographic databases.

### Supported Formats

| Format | Extension | Primary Use |
|--------|-----------|-------------|
| CIF | .cif | Crystallographic Information File; universal exchange format accepted by most codes |
| POSCAR | .vasp | VASP input format; defines lattice vectors, atom positions, and species |
| XYZ | .xyz | Simple Cartesian coordinate format; widely used for molecular visualization |

### How to Export

**From the material detail page:**

1. Click the **Download** button next to the crystal structure viewer
2. Select the desired format (CIF, POSCAR, or XYZ)
3. The file downloads with the naming convention \`{formula}_{material_id}.{ext}\`

**From builder results:**

After generating a supercell, surface, or nanoparticle, the export buttons appear below the generated structure viewer.

### CIF Details

The exported CIF file follows the CIF 1.1 standard and includes:

- Unit cell parameters (a, b, c, alpha, beta, gamma)
- Space group symbol and number
- Atomic positions in fractional coordinates
- Site occupancies and isotropic displacement parameters
- Symmetry operations

### POSCAR Details

POSCAR files are formatted for direct use with VASP:

\`\`\`
Si2                          # System name
1.0                          # Universal scaling factor
  5.468 0.000 0.000          # Lattice vector a
  0.000 5.468 0.000          # Lattice vector b
  0.000 0.000 5.468          # Lattice vector c
Si                           # Element symbols
8                            # Number of atoms per element
Direct                       # Fractional coordinates
  0.000 0.000 0.000
  ...
\`\`\`

### XYZ Details

XYZ files contain Cartesian coordinates in Angstroms. They do not include periodicity information, so they are best suited for molecular clusters or nanoparticles.

### API Export

\`\`\`bash
# Download CIF
curl -O "https://api.matcraft.ai/api/v1/materials/mp-149/export/cif"

# Download POSCAR
curl -O "https://api.matcraft.ai/api/v1/materials/mp-149/export/poscar"

# Download XYZ
curl -O "https://api.matcraft.ai/api/v1/materials/mp-149/export/xyz"
\`\`\`

### Batch Export

Use the API to export structures in bulk for high-throughput screening workflows:

\`\`\`python
from matcraft import MatCraftClient

client = MatCraftClient()
materials = client.search(band_gap_max=1.5, limit=100)
for mat in materials:
    mat.export("poscar", path=f"structures/{mat.material_id}.vasp")
\`\`\`
`,
};

export default page;
