import { DocPage } from "../index";

const page: DocPage = {
  slug: "band-structure",
  title: "Band Structure Visualization",
  description: "View and interpret electronic band structures from Materials Project data.",
  category: "features",
  order: 5,
  lastUpdated: "2026-04-10",
  tags: ["band-structure", "electronic", "visualization", "physics"],
  readingTime: 5,
  body: `
## Band Structure Visualization

MatCraft displays electronic band structure diagrams for materials that have band structure data available in the Materials Project database. These plots show how electron energy levels vary along high-symmetry paths in the Brillouin zone.

### What Band Structures Show

A band structure plot has the reciprocal-space path (k-points) on the x-axis and energy (eV) on the y-axis. Key features to look for:

- **Fermi level**: The horizontal dashed line at 0 eV separating occupied and unoccupied states
- **Band gap**: The energy range with no states between the valence band maximum (VBM) and conduction band minimum (CBM)
- **Direct vs. indirect gap**: If VBM and CBM occur at the same k-point, the gap is direct; otherwise it is indirect
- **Band dispersion**: Steep bands indicate light effective mass (high mobility); flat bands indicate heavy carriers

### Viewing Band Structures

Navigate to any material's detail page and click the **Band Structure** tab. The plot loads from the Materials Project API in real-time. Spin-up and spin-down channels are shown in blue and red for magnetic materials.

### High-Symmetry Path

The k-point path follows the standard conventions for each Bravais lattice type. Common high-symmetry points are labeled on the x-axis:

- **Cubic FCC**: Gamma - X - W - K - Gamma - L - U - W - L - K
- **Cubic BCC**: Gamma - H - N - Gamma - P - H
- **Hexagonal**: Gamma - M - K - Gamma - A - L - H - A

### Interactivity

- Hover over any band to see the energy value at that k-point
- Click on the VBM or CBM markers to see their exact positions and energies
- Toggle spin channels on/off for magnetic materials
- Zoom into specific energy ranges using the y-axis range controls

### Data Source

Band structure data comes from the Materials Project's GGA/GGA+U calculations (PBE functional). Be aware that DFT band gaps are typically underestimated compared to experimental values. HSE06 or GW corrections are not included.

### Export

Download the band structure as:

- **PNG/SVG** for publications
- **JSON** raw data (k-points, energies, spin channels)
- **Jupyter notebook** with matplotlib code to reproduce the plot

### API Access

\`\`\`bash
curl "https://matcraft.io/api/electronic/bandstructure/mp-149"
\`\`\`

Returns the full band structure data including k-point coordinates, energy eigenvalues per band, and metadata about the calculation.
`,
};

export default page;
