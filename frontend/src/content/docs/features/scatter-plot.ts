import { DocPage } from "../index";

const page: DocPage = {
  slug: "scatter-plot",
  title: "Property Scatter Plot",
  description: "Interactive 2D correlation plots for exploring property relationships across materials.",
  category: "features",
  order: 4,
  lastUpdated: "2026-04-10",
  tags: ["scatter", "plot", "visualization", "correlation"],
  readingTime: 4,
  body: `
## Property Scatter Plot

The scatter plot tool lets you visualize relationships between any two material properties across the entire database. This is invaluable for identifying trends, outliers, and promising regions of property space.

### Creating a Plot

1. Navigate to the **Scatter Plot** tab from the main dashboard
2. Select the X-axis property from the dropdown (e.g., band gap)
3. Select the Y-axis property (e.g., formation energy)
4. Optionally color points by a third property or by data source
5. Click **Generate** to render the plot

### Available Properties

All numeric properties in the database are available for plotting:

- Band gap (eV)
- Formation energy (eV/atom)
- Energy above hull (eV/atom)
- Density (g/cm3)
- Volume per atom (A3)
- Number of elements
- Number of sites

### Interactivity

- **Hover** over any point to see the material formula, ID, and property values
- **Click** a point to navigate to that material's detail page
- **Brush select** a region to filter the materials list to only those in the selection
- **Zoom** with scroll wheel; **pan** with click-drag on the background

### Color Mapping

Points can be colored by:

- **Data source**: Materials Project (blue), AFLOW (green), JARVIS (orange)
- **Crystal system**: Each system gets a distinct color
- **Continuous property**: A gradient color scale maps a third property onto the scatter points

### Filtering

Apply any search filters before generating the plot. Only materials matching your current filters will appear. This lets you focus on specific chemical systems or stability ranges.

### Export

Export the current plot as:

- **PNG/SVG**: Publication-ready static images
- **CSV**: Raw data for the plotted materials
- **Jupyter notebook**: Auto-generated notebook that reproduces the plot with matplotlib

### API Endpoint

\`\`\`bash
curl "https://api.matcraft.ai/api/v1/materials/scatter?x=band_gap&y=formation_energy&color=source&limit=5000"
\`\`\`

The API returns JSON with arrays for x, y, color, formula, and material_id fields suitable for client-side rendering.
`,
};

export default page;
