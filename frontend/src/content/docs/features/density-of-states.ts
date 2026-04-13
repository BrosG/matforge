import { DocPage } from "../index";

const page: DocPage = {
  slug: "density-of-states",
  title: "Density of States",
  description: "Visualize total and element-projected density of states for electronic structure analysis.",
  category: "features",
  order: 6,
  lastUpdated: "2026-04-10",
  tags: ["dos", "density-of-states", "electronic", "visualization"],
  readingTime: 5,
  body: `
## Density of States

The density of states (DOS) shows the number of available electronic states at each energy level. MatCraft renders both total DOS and element-projected partial DOS (pDOS) for materials with data available from the Materials Project.

### Understanding DOS Plots

The DOS plot has energy (eV) on the x-axis and density of states (states/eV/unit cell) on the y-axis:

- **Total DOS**: The black curve showing all electronic states combined
- **Partial DOS**: Colored curves showing contributions from individual elements
- **Fermi level**: Vertical dashed line at 0 eV
- **Band gap**: Region around the Fermi level with zero (or near-zero) DOS in semiconductors/insulators

### What You Can Learn

- **Metallic vs. insulating**: Metals have non-zero DOS at the Fermi level; insulators have a gap
- **Element contributions**: pDOS reveals which elements dominate the valence band vs. conduction band
- **Orbital character**: In transition metal compounds, d-states often dominate near the Fermi level
- **Hybridization**: Overlapping pDOS peaks from different elements indicate orbital hybridization

### Viewing DOS

Open any material's detail page and select the **Density of States** tab. The plot loads dynamically from the Materials Project API.

### Display Options

- **Total only**: Show just the total DOS curve
- **Element-projected**: Show pDOS for each element with distinct colors
- **Stacked area**: Fill under each element's curve for visual clarity
- **Spin-resolved**: Show up-spin and down-spin DOS separately (for magnetic materials)

### Interactivity

- Hover to read exact DOS values at any energy
- Click element labels in the legend to toggle individual pDOS curves
- Drag to zoom into specific energy ranges
- Double-click to reset the view

### Integration with Band Structure

The DOS and band structure are complementary views of the same electronic structure. A narrow band in the band structure corresponds to a sharp peak in the DOS. MatCraft displays both side-by-side when available.

### Export Options

- **PNG/SVG**: High-resolution plots for publications
- **JSON**: Raw DOS data (energy grid, total DOS, element-projected arrays)
- **Jupyter notebook**: Python code to reproduce the plot

### API Access

\`\`\`bash
curl "https://api.matcraft.ai/api/v1/electronic/dos/mp-149"
\`\`\`

Returns energy array, total DOS array, and per-element partial DOS arrays.
`,
};

export default page;
