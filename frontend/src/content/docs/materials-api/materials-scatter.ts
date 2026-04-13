import { DocPage } from "../index";

const page: DocPage = {
  slug: "materials-scatter",
  title: "Scatter Plot Data",
  description: "GET /materials/scatter to retrieve property pairs for visualization scatter plots.",
  category: "materials-api",
  order: 6,
  lastUpdated: "2026-04-10",
  tags: ["api", "scatter", "plot", "visualization"],
  readingTime: 4,
  body: `
## Scatter Plot Data

Retrieve paired property data for generating scatter plots across the materials database.

### Endpoint

\`\`\`
GET /api/materials/scatter
\`\`\`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`x\` | string | yes | Property for x-axis |
| \`y\` | string | yes | Property for y-axis |
| \`color\` | string | no | Property or category for color encoding |
| \`elements\` | string | no | Filter by elements (comma-separated) |
| \`band_gap_min\` | float | no | Minimum band gap filter |
| \`band_gap_max\` | float | no | Maximum band gap filter |
| \`e_above_hull_max\` | float | no | Maximum Ehull filter |
| \`source\` | string | no | Data source filter |
| \`limit\` | int | no | Max points to return (default 5000) |

### Available Properties

Values for \`x\`, \`y\`, and \`color\` parameters:

\`band_gap\`, \`formation_energy\`, \`e_above_hull\`, \`density\`, \`volume\`, \`n_sites\`, \`n_elements\`

For \`color\` only: \`source\`, \`crystal_system\`

### Example Request

\`\`\`bash
curl "https://api.matcraft.ai/api/v1/materials/scatter?x=band_gap&y=formation_energy&color=source&e_above_hull_max=0.1&limit=2000"
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "x": [0.0, 0.52, 1.11, 1.42, ...],
    "y": [-3.2, -1.8, 0.0, -0.7, ...],
    "color": ["mp", "aflow", "mp", "jarvis", ...],
    "formula": ["Fe", "GaN", "Si", "GaAs", ...],
    "material_id": ["mp-13", "aflow-456", "mp-149", "jvasp-1002", ...]
  },
  "meta": {
    "x_label": "Band Gap (eV)",
    "y_label": "Formation Energy (eV/atom)",
    "color_label": "Data Source",
    "total_points": 2000,
    "took_ms": 85
  }
}
\`\`\`

### Response Format

The response uses a columnar format for efficiency -- arrays of equal length for each field. This is optimized for direct use with plotting libraries like Plotly, D3.js, and matplotlib.

### Performance Notes

- The default limit of 5000 points is suitable for browser-based rendering
- For full-database exports, use pagination with the \`/materials\` endpoint instead
- Server-side random sampling is applied when the filtered dataset exceeds the limit
- Response times are typically 50-200ms depending on filter complexity

### Python Example

\`\`\`python
import requests
import matplotlib.pyplot as plt

resp = requests.get("https://api.matcraft.ai/api/v1/materials/scatter", params={
    "x": "band_gap", "y": "density", "limit": 3000
})
data = resp.json()["data"]

plt.scatter(data["x"], data["y"], s=2, alpha=0.5)
plt.xlabel("Band Gap (eV)")
plt.ylabel("Density (g/cm3)")
plt.show()
\`\`\`
`,
};

export default page;
