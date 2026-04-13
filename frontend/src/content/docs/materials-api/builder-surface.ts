import { DocPage } from "../index";

const page: DocPage = {
  slug: "builder-surface",
  title: "Surface Builder",
  description: "POST /builder/surface to generate surface slab structures with specified Miller indices.",
  category: "materials-api",
  order: 12,
  lastUpdated: "2026-04-10",
  tags: ["api", "builder", "surface", "slab", "post"],
  readingTime: 4,
  body: `
## Surface Builder

Generate a surface slab structure from a bulk material with specified Miller index orientation and vacuum layer.

### Endpoint

\`\`\`
POST /api/builder/surface
\`\`\`

### Request Body

\`\`\`json
{
  "material_id": "mp-149",
  "h": 1,
  "k": 1,
  "l": 0,
  "layers": 5,
  "vacuum": 15.0
}
\`\`\`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| \`material_id\` | string | yes | -- | Source material identifier |
| \`h\` | int | yes | -- | Miller index h |
| \`k\` | int | yes | -- | Miller index k |
| \`l\` | int | yes | -- | Miller index l |
| \`layers\` | int | no | 5 | Number of atomic layers in slab |
| \`vacuum\` | float | no | 15.0 | Vacuum thickness in Angstroms |

### Example Request

\`\`\`bash
curl -X POST "https://api.matcraft.ai/api/v1/builder/surface" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"material_id": "mp-149", "h": 1, "k": 1, "l": 0, "layers": 5, "vacuum": 15.0}'
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "original_id": "mp-149",
    "original_formula": "Si",
    "miller_index": [1, 1, 0],
    "n_layers": 5,
    "vacuum_thickness": 15.0,
    "n_atoms": 20,
    "lattice": {
      "a": 3.867, "b": 5.468, "c": 28.72,
      "alpha": 90.0, "beta": 90.0, "gamma": 90.0
    },
    "sites": [
      { "species": "Si", "abc": [0.0, 0.0, 0.261], "xyz": [0.0, 0.0, 7.5] }
    ],
    "termination": "Si",
    "surface_area": 21.14,
    "export_urls": {
      "cif": "/api/builder/result/def456/export/cif",
      "poscar": "/api/builder/result/def456/export/poscar",
      "xyz": "/api/builder/result/def456/export/xyz"
    }
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`miller_index\` | int[] | Applied Miller indices [h, k, l] |
| \`n_layers\` | int | Number of atomic layers in the slab |
| \`vacuum_thickness\` | float | Vacuum region thickness (Angstroms) |
| \`termination\` | string | Surface termination species |
| \`surface_area\` | float | Surface area in Angstroms squared |
| \`sites\` | array | All atomic positions |
| \`export_urls\` | object | Download URLs for structure files |

### Validation

- Miller indices must not all be zero
- Layers must be between 1 and 20
- Vacuum must be between 0.0 and 50.0 Angstroms
- Total atoms must not exceed 500

### Notes

- The slab is oriented with the surface normal along the c-axis
- Symmetric slabs (inversion center) are generated when possible to avoid dipole effects
- For asymmetric terminations, the default termination is chosen; specify \`termination\` in the request body to select alternatives
`,
};

export default page;
