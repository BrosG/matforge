import { DocPage } from "../index";

const page: DocPage = {
  slug: "electronic-phase",
  title: "Phase Diagram",
  description: "GET /electronic/phase_diagram to compute convex hull phase diagrams for chemical systems.",
  category: "materials-api",
  order: 10,
  lastUpdated: "2026-04-10",
  tags: ["api", "phase-diagram", "convex-hull", "thermodynamics"],
  readingTime: 4,
  body: `
## Phase Diagram

Compute a convex hull phase diagram for a given chemical system.

### Endpoint

\`\`\`
GET /api/electronic/phase_diagram
\`\`\`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`system\` | string | yes | Chemical system, elements separated by hyphens (e.g., "Li-Fe-O") |

### Example Request

\`\`\`bash
curl "https://matcraft.io/api/electronic/phase_diagram?system=Li-Fe-O"
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "system": "Li-Fe-O",
    "elements": ["Li", "Fe", "O"],
    "n_phases": 42,
    "stable_phases": [
      {
        "material_id": "mp-1960",
        "formula": "Li2O",
        "formation_energy": -2.03,
        "e_above_hull": 0.0,
        "composition": { "Li": 0.667, "O": 0.333 }
      },
      {
        "material_id": "mp-19017",
        "formula": "LiFePO4",
        "formation_energy": -3.45,
        "e_above_hull": 0.0,
        "composition": { "Li": 0.143, "Fe": 0.143, "P": 0.143, "O": 0.571 }
      }
    ],
    "unstable_phases": [
      {
        "material_id": "mp-25432",
        "formula": "Li3FeO3",
        "formation_energy": -2.15,
        "e_above_hull": 0.087,
        "composition": { "Li": 0.429, "Fe": 0.143, "O": 0.429 }
      }
    ],
    "hull_vertices": [
      { "composition": [0.0, 0.0], "energy": 0.0, "formula": "Li" },
      { "composition": [1.0, 0.0], "energy": 0.0, "formula": "Fe" },
      { "composition": [0.0, 1.0], "energy": 0.0, "formula": "O2" }
    ]
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`system\` | string | Chemical system queried |
| \`elements\` | string[] | Elements in the system |
| \`stable_phases\` | array | Phases on the convex hull (Ehull = 0) |
| \`unstable_phases\` | array | Phases above the hull (Ehull > 0) |
| \`hull_vertices\` | array | Vertices of the convex hull for plotting |

### System Notation

- **Binary**: "Ti-O", "Li-Co"
- **Ternary**: "Li-Fe-O", "Ga-As-N"
- **Quaternary**: "Li-Mn-Ni-O" (limited to 4 elements)

### Notes

- Formation energies are computed from Materials Project DFT data
- The convex hull is constructed using the Qhull algorithm
- For ternary systems, the response includes triangulated hull facets for rendering
- Systems with more than 4 elements are not supported due to visualization complexity
- Computation time scales with the number of known phases in the system (typically 100-500ms)
`,
};

export default page;
