import { DocPage } from "../index";

const page: DocPage = {
  slug: "electronic-xrd",
  title: "XRD Simulation",
  description: "GET /electronic/xrd/{mp_id} to retrieve simulated powder X-ray diffraction patterns.",
  category: "materials-api",
  order: 9,
  lastUpdated: "2026-04-10",
  tags: ["api", "xrd", "diffraction", "get"],
  readingTime: 4,
  body: `
## XRD Simulation

Retrieve simulated powder X-ray diffraction (XRD) patterns computed from crystal structure data.

### Endpoint

\`\`\`
GET /api/electronic/xrd/{mp_id}
\`\`\`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`mp_id\` | string | Material identifier (e.g., "mp-149") |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| \`radiation\` | string | "CuKa" | X-ray source: CuKa, MoKa, CoKa |
| \`two_theta_min\` | float | 10.0 | Minimum 2-theta angle (degrees) |
| \`two_theta_max\` | float | 90.0 | Maximum 2-theta angle (degrees) |

### Example Request

\`\`\`bash
curl "https://api.matcraft.ai/api/v1/electronic/xrd/mp-149?radiation=CuKa&two_theta_min=10&two_theta_max=80"
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "material_id": "mp-149",
    "formula": "Si",
    "radiation": "CuKa",
    "wavelength": 1.5406,
    "pattern": {
      "two_theta": [10.0, 10.05, 10.1, ..., 80.0],
      "intensity": [0.0, 0.0, 0.0, ..., 0.0]
    },
    "peaks": [
      { "two_theta": 28.44, "intensity": 100.0, "hkl": "111", "d_spacing": 3.135 },
      { "two_theta": 47.30, "intensity": 55.2, "hkl": "220", "d_spacing": 1.920 },
      { "two_theta": 56.12, "intensity": 30.1, "hkl": "311", "d_spacing": 1.637 }
    ],
    "n_peaks": 8
  }
}
\`\`\`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| \`wavelength\` | float | X-ray wavelength in Angstroms |
| \`pattern.two_theta\` | float[] | Full diffraction pattern x-axis (degrees) |
| \`pattern.intensity\` | float[] | Full pattern y-axis (relative intensity, 0-100) |
| \`peaks\` | array | Identified peak positions with Miller indices |
| \`peaks[].two_theta\` | float | Peak position in degrees |
| \`peaks[].intensity\` | float | Relative peak intensity |
| \`peaks[].hkl\` | string | Miller index label |
| \`peaks[].d_spacing\` | float | Interplanar spacing in Angstroms |

### Radiation Sources

| Name | Wavelength (A) |
|------|---------------|
| CuKa | 1.5406 |
| MoKa | 0.7107 |
| CoKa | 1.7890 |

### Notes

- Patterns are computed using kinematic diffraction theory (no absorption or extinction corrections)
- Peak broadening uses a default pseudo-Voigt profile with FWHM of 0.1 degrees
- Intensity includes the Lorentz-polarization factor and multiplicity
- Available for all materials regardless of data source
`,
};

export default page;
