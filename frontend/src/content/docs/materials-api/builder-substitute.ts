import { DocPage } from "../index";

const page: DocPage = {
  slug: "builder-substitute",
  title: "Substitution Builder",
  description: "POST /builder/substitute to replace elements in a crystal structure for doping studies.",
  category: "materials-api",
  order: 14,
  lastUpdated: "2026-04-10",
  tags: ["api", "builder", "substitution", "doping", "post"],
  readingTime: 4,
  body: `
## Substitution Builder

Replace all atoms of one element with another element in a crystal structure. This is useful for computational screening of dopants, alloy compositions, and isoelectronic substitutions.

### Endpoint

\`\`\`
POST /api/builder/substitute
\`\`\`

### Request Body

\`\`\`json
{
  "material_id": "mp-149",
  "source_element": "Si",
  "target_element": "Ge"
}
\`\`\`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| \`material_id\` | string | yes | Source material identifier |
| \`source_element\` | string | yes | Element to replace (must exist in the structure) |
| \`target_element\` | string | yes | Replacement element (valid element symbol) |

### Example Request

\`\`\`bash
curl -X POST "https://matcraft.io/api/builder/substitute" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"material_id": "mp-149", "source_element": "Si", "target_element": "Ge"}'
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "original_id": "mp-149",
    "original_formula": "Si",
    "new_formula": "Ge",
    "source_element": "Si",
    "target_element": "Ge",
    "n_substituted": 2,
    "n_atoms": 2,
    "lattice": {
      "a": 5.468, "b": 5.468, "c": 5.468,
      "alpha": 90.0, "beta": 90.0, "gamma": 90.0
    },
    "sites": [
      { "species": "Ge", "abc": [0.0, 0.0, 0.0], "xyz": [0.0, 0.0, 0.0] },
      { "species": "Ge", "abc": [0.25, 0.25, 0.25], "xyz": [1.367, 1.367, 1.367] }
    ],
    "export_urls": {
      "cif": "/api/builder/result/jkl012/export/cif",
      "poscar": "/api/builder/result/jkl012/export/poscar",
      "xyz": "/api/builder/result/jkl012/export/xyz"
    }
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`original_formula\` | string | Formula before substitution |
| \`new_formula\` | string | Formula after substitution |
| \`n_substituted\` | int | Number of atoms that were replaced |
| \`lattice\` | object | Lattice parameters (unchanged from original) |
| \`sites\` | array | Atomic positions with updated species |
| \`export_urls\` | object | Download URLs for the modified structure |

### Important Notes

- Lattice parameters are NOT relaxed after substitution -- the structure uses the original lattice
- For accurate properties of the substituted structure, run a DFT relaxation on the exported structure
- All atoms of the source element are replaced; partial substitution is not currently supported
- Combine with the supercell builder to create dilute doping configurations (build supercell first, then substitute one site manually)

### Validation

- Source element must exist in the material's composition
- Target element must be a valid element symbol (H through Og)
- Source and target elements must be different

### Authentication

This endpoint requires authentication. Guest access is not permitted.
`,
};

export default page;
