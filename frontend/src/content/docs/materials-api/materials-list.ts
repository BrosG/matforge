import { DocPage } from "../index";

const page: DocPage = {
  slug: "materials-list",
  title: "List Materials",
  description: "GET /materials endpoint with all filter parameters, sorting, and pagination.",
  category: "materials-api",
  order: 2,
  lastUpdated: "2026-04-10",
  tags: ["api", "materials", "search", "filter", "get"],
  readingTime: 6,
  body: `
## List Materials

Retrieve a paginated list of materials matching filter criteria.

### Endpoint

\`\`\`
GET /api/materials
\`\`\`

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| \`search\` | string | -- | Text search across formula and material ID |
| \`elements\` | string | -- | Comma-separated elements to include (e.g., "Li,Fe,O") |
| \`exclude_elements\` | string | -- | Elements to exclude |
| \`n_elements_min\` | int | -- | Minimum number of distinct elements |
| \`n_elements_max\` | int | -- | Maximum number of distinct elements |
| \`band_gap_min\` | float | -- | Minimum band gap (eV) |
| \`band_gap_max\` | float | -- | Maximum band gap (eV) |
| \`e_above_hull_max\` | float | -- | Maximum energy above hull (eV/atom) |
| \`density_min\` | float | -- | Minimum density (g/cm3) |
| \`density_max\` | float | -- | Maximum density (g/cm3) |
| \`crystal_system\` | string | -- | Crystal system filter (cubic, hexagonal, etc.) |
| \`space_group\` | string | -- | Space group symbol |
| \`source\` | string | -- | Data source: mp, aflow, jarvis |
| \`sort\` | string | "formula" | Sort field |
| \`order\` | string | "asc" | Sort order: asc or desc |
| \`page\` | int | 1 | Page number |
| \`per_page\` | int | 20 | Results per page (max 100) |

### Example Request

\`\`\`bash
curl "https://matcraft.io/api/materials?elements=Li,O&band_gap_min=1.0&band_gap_max=3.0&e_above_hull_max=0.05&sort=band_gap&order=asc&per_page=5"
\`\`\`

### Example Response

\`\`\`json
{
  "data": [
    {
      "material_id": "mp-1960",
      "formula": "Li2O",
      "band_gap": 5.04,
      "formation_energy": -2.03,
      "e_above_hull": 0.0,
      "density": 2.01,
      "crystal_system": "cubic",
      "space_group": "Fm-3m",
      "n_sites": 3,
      "source": "mp"
    }
  ],
  "meta": {
    "total": 847,
    "page": 1,
    "per_page": 5,
    "took_ms": 32
  }
}
\`\`\`

### Sort Fields

Available values for the \`sort\` parameter:

\`formula\`, \`band_gap\`, \`formation_energy\`, \`e_above_hull\`, \`density\`, \`n_sites\`, \`n_elements\`, \`volume\`

### Notes

- Multiple element filters use AND logic (all listed elements must be present)
- Text search on \`search\` parameter matches against formula and material ID
- The \`e_above_hull_max\` filter is commonly set to 0.05 eV/atom for thermodynamically stable materials
- Empty filter parameters are ignored (not applied)
`,
};

export default page;
