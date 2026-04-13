import { DocPage } from "../index";

const page: DocPage = {
  slug: "electronic-dos",
  title: "Density of States",
  description: "GET /electronic/dos/{mp_id} to retrieve total and element-projected DOS data.",
  category: "materials-api",
  order: 8,
  lastUpdated: "2026-04-10",
  tags: ["api", "dos", "electronic", "get"],
  readingTime: 4,
  body: `
## Density of States

Retrieve total and element-projected density of states (DOS) data from the Materials Project.

### Endpoint

\`\`\`
GET /api/electronic/dos/{mp_id}
\`\`\`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`mp_id\` | string | Materials Project ID (e.g., "mp-149") |

### Example Request

\`\`\`bash
curl "https://matcraft.io/api/electronic/dos/mp-149"
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "material_id": "mp-149",
    "formula": "Si",
    "efermi": 5.87,
    "energies": [-15.0, -14.95, -14.9, ..., 10.0],
    "total_dos": {
      "spin_up": [0.0, 0.01, 0.02, ...],
      "spin_down": null
    },
    "element_dos": {
      "Si": {
        "spin_up": [0.0, 0.01, 0.02, ...],
        "spin_down": null
      }
    },
    "n_points": 501,
    "energy_range": [-15.0, 10.0]
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`efermi\` | float | Fermi energy in eV (absolute scale) |
| \`energies\` | float[] | Energy grid in eV (Fermi-referenced in plot) |
| \`total_dos.spin_up\` | float[] | Total DOS for spin-up channel (states/eV/cell) |
| \`total_dos.spin_down\` | float[] or null | Spin-down DOS (null if non-magnetic) |
| \`element_dos\` | object | Per-element projected DOS with same structure |
| \`n_points\` | int | Number of energy grid points |

### Plotting Example

\`\`\`python
import requests
import matplotlib.pyplot as plt

resp = requests.get("https://matcraft.io/api/electronic/dos/mp-149")
data = resp.json()["data"]

energies = [e - data["efermi"] for e in data["energies"]]
plt.plot(energies, data["total_dos"]["spin_up"], "k-", label="Total")

for element, dos in data["element_dos"].items():
    plt.plot(energies, dos["spin_up"], label=element)

plt.xlabel("Energy - E_F (eV)")
plt.ylabel("DOS (states/eV/cell)")
plt.axvline(0, color="gray", linestyle="--")
plt.legend()
plt.show()
\`\`\`

### Notes

- DOS data is Gaussian-broadened with a default sigma of 0.1 eV
- Energy grid is uniformly spaced from -15 to +10 eV relative to the Fermi level
- Only Materials Project IDs are supported; AFLOW and JARVIS return 404

### Error Responses

| Status | When |
|--------|------|
| 404 | Material not found or no DOS data available |
| 400 | Invalid material ID format |
`,
};

export default page;
