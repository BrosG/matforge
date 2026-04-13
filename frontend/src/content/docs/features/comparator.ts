import { DocPage } from "../index";

const page: DocPage = {
  slug: "comparator",
  title: "Material Comparator",
  description: "Compare properties of up to 5 materials side-by-side in a unified table view.",
  category: "features",
  order: 12,
  lastUpdated: "2026-04-10",
  tags: ["compare", "comparison", "side-by-side"],
  readingTime: 4,
  body: `
## Material Comparator

The comparator lets you place up to five materials side-by-side to evaluate their properties, crystal structures, and application suitability scores in a single view.

### Adding Materials to Compare

There are three ways to add materials to the comparator:

1. **From search results**: Click the compare checkbox on any material card in the search results
2. **From detail pages**: Click the "Add to Compare" button on a material detail page
3. **Direct entry**: Type material IDs into the comparator search bar (e.g., mp-149, mp-2534)

### Comparison Table

The comparator displays a table with materials as columns and properties as rows:

| Property | Material 1 | Material 2 | Material 3 |
|----------|-----------|-----------|-----------|
| Formula | Si | GaAs | CdTe |
| Band gap (eV) | 1.11 | 1.42 | 1.44 |
| Crystal system | Cubic | Cubic | Cubic |
| Density (g/cm3) | 2.33 | 5.32 | 5.85 |
| Ehull (eV/atom) | 0.000 | 0.000 | 0.000 |

The best value in each row is highlighted in green, making it easy to spot which material excels at each property.

### Visual Comparisons

Beyond the property table, the comparator offers:

- **Radar chart**: A spider plot showing normalized properties for all compared materials on the same axes
- **Crystal structures**: Side-by-side 3D viewers for visual structural comparison
- **Application scores**: Bar charts comparing suitability scores across all applications

### Filtering Properties

Not all properties are relevant for every comparison. Use the property filter to show only the rows that matter for your analysis. Common presets include:

- **Electronic**: Band gap, DOS effective mass, dielectric constant
- **Thermodynamic**: Formation energy, Ehull, decomposition products
- **Mechanical**: Bulk modulus, shear modulus, Poisson ratio
- **Basic**: Formula, space group, density, volume

### Sharing Comparisons

The comparator state is encoded in the URL. Copy the URL to share a specific comparison set with collaborators. The URL format is:

\`\`\`
https://matcraft.ai/compare?ids=mp-149,mp-2534,mp-406
\`\`\`

### Export

Export the comparison table as CSV or as a formatted PDF report suitable for inclusion in research documents.
`,
};

export default page;
