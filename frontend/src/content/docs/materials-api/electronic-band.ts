import { DocPage } from "../index";

const page: DocPage = {
  slug: "electronic-band",
  title: "Band Structure",
  description: "GET /electronic/bandstructure/{mp_id} to retrieve electronic band structure data.",
  category: "materials-api",
  order: 7,
  lastUpdated: "2026-04-10",
  tags: ["api", "band-structure", "electronic", "get"],
  readingTime: 4,
  body: `
## Band Structure

Retrieve electronic band structure data for a material from the Materials Project.

### Endpoint

\`\`\`
GET /api/electronic/bandstructure/{mp_id}
\`\`\`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`mp_id\` | string | Materials Project ID (e.g., "mp-149") |

### Example Request

\`\`\`bash
curl "https://api.matcraft.ai/api/v1/electronic/bandstructure/mp-149"
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "material_id": "mp-149",
    "formula": "Si",
    "band_gap": 1.11,
    "is_gap_direct": false,
    "vbm": { "energy": 0.0, "kpoint": [0.0, 0.0, 0.0], "label": "\\u0393" },
    "cbm": { "energy": 1.11, "kpoint": [0.42, 0.42, 0.0], "label": "X" },
    "kpoints": {
      "distances": [0.0, 0.05, 0.10, ...],
      "labels": [["\\u0393", "X"], ["X", "W"], ["W", "K"], ...]
    },
    "bands": {
      "spin_up": [
        [-12.3, -12.1, -11.9, ...],
        [-6.5, -6.2, -5.8, ...],
        ...
      ],
      "spin_down": null
    },
    "efermi": 5.87,
    "n_bands": 16,
    "n_kpoints": 180
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`band_gap\` | float | Band gap in eV |
| \`is_gap_direct\` | bool | Direct or indirect gap |
| \`vbm\` | object | Valence band maximum position and energy |
| \`cbm\` | object | Conduction band minimum position and energy |
| \`kpoints.distances\` | float[] | Cumulative k-path distances for plotting |
| \`kpoints.labels\` | string[][] | High-symmetry point labels and segment boundaries |
| \`bands.spin_up\` | float[][] | Energy eigenvalues per band per k-point (eV, Fermi-referenced) |
| \`bands.spin_down\` | float[][] or null | Down-spin bands (null for non-magnetic) |

### Notes

- Band energies are referenced to the Fermi level (efermi = 0 in the plotted bands)
- Data is sourced from Materials Project GGA/GGA+U calculations
- Only materials with Materials Project IDs (mp-*) have band structure data available
- AFLOW and JARVIS materials return 404 for this endpoint

### Error Responses

| Status | When |
|--------|------|
| 404 | Material not found or no band structure data available |
| 400 | Invalid material ID format |
`,
};

export default page;
