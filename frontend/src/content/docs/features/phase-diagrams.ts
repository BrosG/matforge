import { DocPage } from "../index";

const page: DocPage = {
  slug: "phase-diagrams",
  title: "Phase Diagrams",
  description: "Explore thermodynamic stability through convex hull analysis and phase diagram visualization.",
  category: "features",
  order: 7,
  lastUpdated: "2026-04-10",
  tags: ["phase-diagram", "thermodynamics", "stability", "convex-hull"],
  readingTime: 5,
  body: `
## Phase Diagrams

MatCraft generates computed phase diagrams using formation energy data from the Materials Project. Phase diagrams reveal thermodynamic stability relationships between competing phases in a chemical system.

### What Is a Phase Diagram?

A phase diagram maps the thermodynamically stable phases as a function of composition. For a binary system A-B, it shows which compounds (if any) are stable at each composition ratio. The convex hull connects the lowest-energy phases -- materials on the hull are thermodynamically stable, while those above it are metastable or unstable.

### Generating a Phase Diagram

1. Navigate to the **Phase Diagram** tool from the dashboard
2. Enter the chemical system (e.g., "Li-Fe-O" or "Ti-O")
3. Click **Generate** to compute the convex hull

MatCraft queries the Materials Project for all known phases in the system and computes the convex hull from their formation energies.

### Reading the Diagram

- **Points on the hull** (solid circles): Thermodynamically stable phases
- **Points above the hull** (open circles): Metastable phases with positive energy above hull
- **Hull edges**: Lines connecting stable phases represent two-phase equilibrium regions
- **Ehull value**: The vertical distance from a point to the hull, in eV/atom

### Supported Systems

- **Binary** (2 elements): 2D convex hull plot (composition vs. energy)
- **Ternary** (3 elements): Triangular phase diagram with color-mapped stability
- **Quaternary** (4 elements): Tetrahedral projection (limited visualization)

### Interactivity

- Hover over any phase to see its formula, formation energy, and energy above hull
- Click a phase to navigate to its material detail page
- Toggle between showing all phases or only stable phases
- Adjust the energy scale to zoom into the near-hull region

### Applications

- **Stability assessment**: Check if a candidate material is thermodynamically stable
- **Decomposition products**: Identify what phases a metastable material would decompose into
- **Synthesis guidance**: Stable phases are more likely to be synthesizable
- **Competing phases**: Understand which phases compete at a given composition

### API Access

\`\`\`bash
curl "https://matcraft.io/api/electronic/phase_diagram?system=Li-Fe-O"
\`\`\`

Returns the convex hull data including all phases, their formation energies, hull distances, and the vertices of the stable hull.
`,
};

export default page;
