import { DocPage } from "../index";

const page: DocPage = {
  slug: "builder-nanoparticle",
  title: "Nanoparticle Builder",
  description: "POST /builder/nanoparticle to carve spherical nanoparticles from bulk crystal structures.",
  category: "materials-api",
  order: 13,
  lastUpdated: "2026-04-10",
  tags: ["api", "builder", "nanoparticle", "cluster", "post"],
  readingTime: 4,
  body: `
## Nanoparticle Builder

Carve a spherical nanoparticle from a bulk crystal structure by including all atoms within a specified radius of the center.

### Endpoint

\`\`\`
POST /api/builder/nanoparticle
\`\`\`

### Request Body

\`\`\`json
{
  "material_id": "mp-149",
  "radius": 10.0
}
\`\`\`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| \`material_id\` | string | yes | Source material identifier |
| \`radius\` | float | yes | Nanoparticle radius in Angstroms (3.0 - 50.0) |

### Example Request

\`\`\`bash
curl -X POST "https://matcraft.io/api/builder/nanoparticle" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"material_id": "mp-149", "radius": 10.0}'
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "original_id": "mp-149",
    "original_formula": "Si",
    "radius": 10.0,
    "n_atoms": 172,
    "diameter": 20.0,
    "composition": { "Si": 172 },
    "sites": [
      { "species": "Si", "xyz": [0.0, 0.0, 0.0] },
      { "species": "Si", "xyz": [1.367, 1.367, 1.367] }
    ],
    "export_urls": {
      "cif": "/api/builder/result/ghi789/export/cif",
      "xyz": "/api/builder/result/ghi789/export/xyz"
    }
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`radius\` | float | Applied radius in Angstroms |
| \`n_atoms\` | int | Total atoms in the nanoparticle |
| \`diameter\` | float | Particle diameter (2 * radius) |
| \`composition\` | object | Atom counts per element |
| \`sites\` | array | Cartesian coordinates of all atoms |
| \`export_urls\` | object | Download URLs (CIF and XYZ; POSCAR not applicable for non-periodic) |

### How It Works

1. A supercell large enough to contain the sphere is generated internally
2. The geometric center of the supercell is computed
3. All atoms within the specified radius of the center are retained
4. The resulting cluster is a non-periodic structure

### Validation

- Radius must be between 3.0 and 50.0 Angstroms
- Total atom count must not exceed 5000
- The material must exist in the database

### Use Cases

- Modeling catalytic nanoparticles for surface reaction studies
- Studying quantum confinement in semiconductor nanocrystals
- Generating starting geometries for molecular dynamics simulations
- Visualizing finite-size effects on electronic structure

### Authentication

This endpoint requires authentication. Guest access is not permitted.
`,
};

export default page;
