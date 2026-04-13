import { DocPage } from "../index";

const page: DocPage = {
  slug: "jupyter-export",
  title: "Jupyter Notebook Export",
  description: "Generate reproducible analysis notebooks with pre-loaded data and visualizations.",
  category: "features",
  order: 9,
  lastUpdated: "2026-04-10",
  tags: ["jupyter", "notebook", "export", "reproducibility"],
  readingTime: 4,
  body: `
## Jupyter Notebook Export

MatCraft can auto-generate Jupyter notebooks for any material, search result, or visualization. These notebooks contain all the code needed to reproduce your analysis outside the MatCraft platform.

### What Gets Exported

Each generated notebook includes:

- **Data loading**: Python code to fetch the material data via the MatCraft API or from a bundled JSON file
- **Property tables**: Pandas DataFrames with all available properties
- **Visualizations**: Matplotlib/Plotly code that reproduces the MatCraft plots (band structure, DOS, XRD, scatter)
- **Structure rendering**: py3Dmol or ASE visualization code for 3D crystal structures
- **Metadata**: Material IDs, data source attribution, and generation timestamp

### How to Export

1. Navigate to any material detail page, search result, or visualization
2. Click the **Export** button in the toolbar
3. Select **Jupyter Notebook (.ipynb)** from the format options
4. The notebook downloads automatically

### Notebook Contents

A typical material detail notebook includes these cells:

\`\`\`python
# Cell 1: Setup
import pandas as pd
import matplotlib.pyplot as plt
from matcraft import MatCraftClient

client = MatCraftClient()
material = client.get_material("mp-149")

# Cell 2: Properties table
props = pd.DataFrame([material.properties])
display(props)

# Cell 3: Crystal structure
from ase.visualize.plot import plot_atoms
plot_atoms(material.to_ase(), rotation="10x,20y")

# Cell 4: Band structure (if available)
bs = client.get_band_structure("mp-149")
bs.plot()
plt.show()
\`\`\`

### Scatter Plot Notebooks

When exporting from the scatter plot view, the notebook includes the complete dataset and matplotlib scatter plot code with the same axis selections, color mappings, and filter criteria you used in the web interface.

### Requirements

Generated notebooks require these Python packages:

- \`matcraft\` (MatCraft Python SDK)
- \`pandas\`, \`numpy\`, \`matplotlib\`
- \`ase\` (for structure manipulation)
- \`py3Dmol\` (for interactive 3D views in Jupyter)

### Reproducibility

All exported notebooks pin the MatCraft API version and include a timestamp so results can be traced back to a specific database snapshot. Data is fetched live by default, but you can switch to the bundled JSON data for offline reproducibility.
`,
};

export default page;
