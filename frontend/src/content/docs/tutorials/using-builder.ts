import { DocPage } from "../index";

const page: DocPage = {
  slug: "using-builder",
  title: "Using the Structure Builder",
  description: "Generate supercells, surface slabs, nanoparticles, and substitution structures step by step.",
  category: "tutorials",
  order: 6,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "builder", "structure", "supercell", "surface"],
  readingTime: 6,
  body: `
## Using the Structure Builder

MatCraft's structure builder tools let you create derivative structures from any material in the database. This tutorial walks through each tool with a practical example.

### Prerequisites

- A MatCraft account (builder tools require authentication)
- A target material in mind (we will use silicon, mp-149, as our example)

### Building a Supercell

Supercells are needed for defect calculations, molecular dynamics, and studying finite-size effects.

**Step 1**: Navigate to the material detail page for Si (mp-149)

**Step 2**: Click the **Builder** tab, then select **Supercell**

**Step 3**: Set the expansion factors:
- a: 2, b: 2, c: 2 (creates 8 copies of the unit cell)

**Step 4**: Click **Build**. The viewer updates to show the 2x2x2 supercell with 16 Si atoms.

**Step 5**: Download the supercell as POSCAR for use in VASP calculations.

### Creating a Surface Slab

Surface slabs are essential for studying catalysis, adsorption, and thin film properties.

**Step 1**: On the same material page, select **Surface** in the Builder tab

**Step 2**: Enter Miller indices: h=1, k=1, l=0

**Step 3**: Set the slab parameters:
- Layers: 6 (enough for converged surface energy)
- Vacuum: 15 Angstroms (prevents interaction between periodic images)

**Step 4**: Click **Build**. The viewer shows the slab with a visible vacuum gap.

**Step 5**: Download as POSCAR. The c-axis will be much longer than a and b due to the vacuum.

### Carving a Nanoparticle

Nanoparticles are useful for studying size-dependent properties and catalytic clusters.

**Step 1**: Select **Nanoparticle** in the Builder tab

**Step 2**: Set the radius to 8.0 Angstroms

**Step 3**: Click **Build**. The viewer shows a spherical cluster of Si atoms.

**Step 4**: Note the atom count displayed (approximately 100 atoms for this radius). For larger nanoparticles, increase the radius gradually.

**Step 5**: Download as XYZ format (nanoparticles are non-periodic).

### Making a Substitution

Substitutions enable rapid screening of dopants and alloy compositions.

**Step 1**: Select **Substitution** in the Builder tab

**Step 2**: Choose the source element (Si) and target element (Ge)

**Step 3**: Click **Build**. All Si atoms are replaced with Ge, creating a hypothetical Ge structure with Si's lattice parameters.

**Step 4**: Download the substituted structure. Remember that the lattice is NOT relaxed -- you should run a geometry optimization with your DFT code.

### Combining Tools

For advanced workflows, chain the tools:

1. Build a 3x3x3 supercell of your material
2. Export it, manually replace one atom in the POSCAR file to create a dilute dopant
3. Use the resulting structure for a defect formation energy calculation

### API Workflow

For automated screening, use the API:

\`\`\`python
from matcraft import MatCraftClient

client = MatCraftClient(token="YOUR_TOKEN")

# Build supercell and export
result = client.build_supercell("mp-149", nx=2, ny=2, nz=2)
result.export("poscar", path="Si_supercell.vasp")

# Build surface
surface = client.build_surface("mp-149", h=1, k=1, l=0, layers=5)
surface.export("poscar", path="Si_110_surface.vasp")
\`\`\`
`,
};

export default page;
