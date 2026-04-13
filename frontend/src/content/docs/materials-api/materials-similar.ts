import { DocPage } from "../index";

const page: DocPage = {
  slug: "materials-similar",
  title: "Similar Materials",
  description: "GET /materials/{id}/similar to find structurally and compositionally related materials.",
  category: "materials-api",
  order: 5,
  lastUpdated: "2026-04-10",
  tags: ["api", "similar", "discovery", "recommendation"],
  readingTime: 4,
  body: `
## Similar Materials

Find materials that are structurally or compositionally similar to a given material. This is useful for exploring alternatives, finding polymorphs, or discovering isostructural compounds.

### Endpoint

\`\`\`
GET /api/materials/{material_id}/similar
\`\`\`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`material_id\` | string | Reference material identifier |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| \`method\` | string | "composition" | Similarity method: \`composition\`, \`structure\`, or \`properties\` |
| \`limit\` | int | 10 | Number of similar materials to return (max 50) |

### Similarity Methods

**Composition-based** (\`method=composition\`): Finds materials with similar elemental composition using the Earth Mover's Distance on composition vectors. Good for finding substitution candidates.

**Structure-based** (\`method=structure\`): Uses structure fingerprints (radial distribution function + angular distribution) to find materials with similar local bonding environments regardless of composition.

**Properties-based** (\`method=properties\`): Finds materials with similar computed properties (band gap, density, formation energy) using normalized Euclidean distance in property space.

### Example Request

\`\`\`bash
curl "https://api.matcraft.ai/api/v1/materials/mp-149/similar?method=structure&limit=5"
\`\`\`

### Example Response

\`\`\`json
{
  "data": [
    {
      "material_id": "mp-32",
      "formula": "Ge",
      "similarity_score": 0.97,
      "band_gap": 0.61,
      "crystal_system": "cubic",
      "space_group": "Fd-3m"
    },
    {
      "material_id": "mp-8086",
      "formula": "Sn",
      "similarity_score": 0.89,
      "band_gap": 0.0,
      "crystal_system": "cubic",
      "space_group": "Fd-3m"
    }
  ],
  "meta": {
    "reference_id": "mp-149",
    "method": "structure",
    "took_ms": 120
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`material_id\` | string | Similar material's ID |
| \`formula\` | string | Chemical formula |
| \`similarity_score\` | float | Similarity score from 0.0 to 1.0 (higher = more similar) |
| Additional property fields from the material record |

### Use Cases

- **Polymorph search**: Find different crystal structures of the same composition
- **Isostructural compounds**: Find materials with the same structure but different elements
- **Property-matched alternatives**: Find cheaper or more abundant materials with similar properties
`,
};

export default page;
