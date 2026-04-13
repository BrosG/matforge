import { DocPage } from "../index";

const page: DocPage = {
  slug: "structure-builder",
  title: "Structure Builder Tools",
  description: "Generate supercells, surfaces, nanoparticles, and substitution structures from any crystal.",
  category: "features",
  order: 2,
  lastUpdated: "2026-04-10",
  tags: ["builder", "supercell", "surface", "nanoparticle", "substitution"],
  readingTime: 5,
  body: `
## Structure Builder Tools

MatCraft's structure builder lets you generate derivative structures from any material in the database. Four builder tools are available: supercell, surface slab, nanoparticle, and atomic substitution.

### Supercell Builder

Create expanded periodic structures by replicating the unit cell along crystallographic axes.

- **Input**: Any material from the database
- **Parameters**: Scaling matrix (Nx, Ny, Nz) from 1x1x1 to 5x5x5
- **Output**: New structure with replicated atoms and scaled lattice vectors

Use supercells to study defect concentrations, finite-size effects in DFT, or to build simulation cells for molecular dynamics.

### Surface Slab Builder

Generate surface slabs for any Miller index orientation:

- **Miller indices**: Specify (h k l) to define the surface orientation
- **Slab thickness**: Number of atomic layers (minimum 3, default 5)
- **Vacuum thickness**: Vacuum layer in Angstroms (default 15.0)
- **Termination**: Choose from available surface terminations

The builder automatically identifies all symmetry-unique terminations and lets you select the desired one. This is essential for surface science studies, catalysis modeling, and thin film design.

### Nanoparticle Builder

Carve spherical nanoparticles from bulk crystal structures:

- **Radius**: Particle radius in Angstroms (3.0 - 50.0)
- **Center**: Automatically centered on a lattice site
- **Output**: Non-periodic cluster of atoms

Nanoparticle structures are useful for studying quantum confinement effects, catalytic nanoparticles, and size-dependent properties.

### Substitution Builder

Replace atoms of one element with another throughout the structure:

- **Source element**: The element to replace
- **Target element**: The replacement element
- **Output**: Modified structure with substituted atoms

This tool enables rapid computational screening of dopants, alloy compositions, and isoelectronic substitutions.

### API Access

All builder tools are available via REST API:

\`\`\`bash
# Build a 2x2x2 supercell
curl -X POST "https://api.matcraft.ai/api/v1/builder/supercell" \\
  -H "Content-Type: application/json" \\
  -d '{"material_id": "mp-149", "nx": 2, "ny": 2, "nz": 2}'

# Generate a (1,1,0) surface slab
curl -X POST "https://api.matcraft.ai/api/v1/builder/surface" \\
  -H "Content-Type: application/json" \\
  -d '{"material_id": "mp-149", "h": 1, "k": 1, "l": 0, "layers": 5}'
\`\`\`

### Download Formats

Generated structures can be downloaded as CIF, POSCAR (VASP), or XYZ files using the export buttons in the viewer or via the API export endpoint.
`,
};

export default page;
