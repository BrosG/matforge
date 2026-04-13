import { DocPage } from "../index";

const page: DocPage = {
  slug: "builder-supercell",
  title: "Supercell Builder",
  description: "POST /builder/supercell to generate expanded periodic structures from unit cells.",
  category: "materials-api",
  order: 11,
  lastUpdated: "2026-04-10",
  tags: ["api", "builder", "supercell", "post"],
  readingTime: 4,
  body: `
## Supercell Builder

Generate an expanded periodic structure by replicating the unit cell along crystallographic axes.

### Endpoint

\`\`\`
POST /api/builder/supercell
\`\`\`

### Request Body

\`\`\`json
{
  "material_id": "mp-149",
  "nx": 2,
  "ny": 2,
  "nz": 2
}
\`\`\`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| \`material_id\` | string | yes | Source material identifier |
| \`nx\` | int | yes | Repetitions along a-axis (1-5) |
| \`ny\` | int | yes | Repetitions along b-axis (1-5) |
| \`nz\` | int | yes | Repetitions along c-axis (1-5) |

### Example Request

\`\`\`bash
curl -X POST "https://api.matcraft.ai/api/v1/builder/supercell" \\
  -H "Content-Type: application/json" \\
  -d '{"material_id": "mp-149", "nx": 2, "ny": 2, "nz": 2}'
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "original_id": "mp-149",
    "original_formula": "Si",
    "supercell_size": [2, 2, 2],
    "n_atoms": 16,
    "lattice": {
      "a": 10.936, "b": 10.936, "c": 10.936,
      "alpha": 90.0, "beta": 90.0, "gamma": 90.0
    },
    "sites": [
      { "species": "Si", "abc": [0.0, 0.0, 0.0], "xyz": [0.0, 0.0, 0.0] },
      { "species": "Si", "abc": [0.125, 0.125, 0.125], "xyz": [1.367, 1.367, 1.367] }
    ],
    "export_urls": {
      "cif": "/api/builder/result/abc123/export/cif",
      "poscar": "/api/builder/result/abc123/export/poscar",
      "xyz": "/api/builder/result/abc123/export/xyz"
    }
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`supercell_size\` | int[] | Applied scaling factors [nx, ny, nz] |
| \`n_atoms\` | int | Total atoms in the supercell |
| \`lattice\` | object | Scaled lattice parameters |
| \`sites\` | array | All atomic positions in the supercell |
| \`export_urls\` | object | URLs to download the structure in various formats |

### Validation

- Each dimension must be between 1 and 5
- Total atom count (original_atoms * nx * ny * nz) must not exceed 1000
- The material must exist in the database

### Authentication

This endpoint requires authentication. Guest access is not permitted for builder endpoints.

### Error Responses

| Status | When |
|--------|------|
| 400 | Invalid parameters (out of range, too many atoms) |
| 401 | Missing authentication |
| 404 | Material not found |
`,
};

export default page;
