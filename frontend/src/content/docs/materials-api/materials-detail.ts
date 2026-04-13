import { DocPage } from "../index";

const page: DocPage = {
  slug: "materials-detail",
  title: "Get Material Detail",
  description: "GET /materials/{id} endpoint returning full material properties and structure data.",
  category: "materials-api",
  order: 3,
  lastUpdated: "2026-04-10",
  tags: ["api", "materials", "detail", "get"],
  readingTime: 5,
  body: `
## Get Material Detail

Retrieve complete information for a single material by its ID.

### Endpoint

\`\`\`
GET /api/materials/{material_id}
\`\`\`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`material_id\` | string | Material identifier (e.g., "mp-149", "aflow-12345", "jvasp-1002") |

### Example Request

\`\`\`bash
curl "https://api.matcraft.ai/api/v1/materials/mp-149"
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "material_id": "mp-149",
    "formula": "Si",
    "formula_pretty": "Si",
    "n_elements": 1,
    "n_sites": 2,
    "crystal_system": "cubic",
    "space_group": "Fd-3m",
    "space_group_number": 227,
    "band_gap": 1.11,
    "is_gap_direct": false,
    "formation_energy": 0.0,
    "e_above_hull": 0.0,
    "density": 2.33,
    "volume": 40.89,
    "lattice": {
      "a": 5.468,
      "b": 5.468,
      "c": 5.468,
      "alpha": 90.0,
      "beta": 90.0,
      "gamma": 90.0
    },
    "sites": [
      { "species": "Si", "xyz": [0.0, 0.0, 0.0], "abc": [0.0, 0.0, 0.0] },
      { "species": "Si", "xyz": [1.367, 1.367, 1.367], "abc": [0.25, 0.25, 0.25] }
    ],
    "source": "mp",
    "source_url": "https://materialsproject.org/materials/mp-149",
    "application_scores": {
      "solar": 72,
      "thermoelectric": 45,
      "catalyst": 30,
      "battery": 10
    },
    "has_band_structure": true,
    "has_dos": true,
    "last_updated": "2025-11-15"
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`material_id\` | string | Unique identifier |
| \`formula\` | string | Chemical formula |
| \`band_gap\` | float | Electronic band gap in eV |
| \`is_gap_direct\` | bool | Whether the band gap is direct |
| \`formation_energy\` | float | Formation energy in eV/atom |
| \`e_above_hull\` | float | Energy above convex hull in eV/atom |
| \`density\` | float | Mass density in g/cm3 |
| \`lattice\` | object | Lattice parameters (a, b, c, alpha, beta, gamma) |
| \`sites\` | array | Atomic positions in Cartesian (xyz) and fractional (abc) coordinates |
| \`application_scores\` | object | AI-estimated suitability scores (0-100) per application |

### Error Responses

| Status | When |
|--------|------|
| 404 | Material ID not found in the database |
| 400 | Malformed material ID format |
`,
};

export default page;
