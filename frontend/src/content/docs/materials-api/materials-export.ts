import { DocPage } from "../index";

const page: DocPage = {
  slug: "materials-export",
  title: "Export Structure",
  description: "GET /materials/{id}/export/{format} to download crystal structures as CIF, POSCAR, or XYZ.",
  category: "materials-api",
  order: 4,
  lastUpdated: "2026-04-10",
  tags: ["api", "export", "cif", "poscar", "xyz"],
  readingTime: 4,
  body: `
## Export Structure

Download a material's crystal structure in standard file formats for use with DFT codes and visualization software.

### Endpoint

\`\`\`
GET /api/materials/{material_id}/export/{format}
\`\`\`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`material_id\` | string | Material identifier (e.g., "mp-149") |
| \`format\` | string | Export format: \`cif\`, \`poscar\`, or \`xyz\` |

### Example Requests

\`\`\`bash
# Download CIF file
curl -O "https://matcraft.io/api/materials/mp-149/export/cif"

# Download POSCAR for VASP
curl -O "https://matcraft.io/api/materials/mp-149/export/poscar"

# Download XYZ coordinates
curl -O "https://matcraft.io/api/materials/mp-149/export/xyz"
\`\`\`

### Response

The response body contains the file content with the appropriate MIME type:

| Format | Content-Type | File Extension |
|--------|-------------|----------------|
| cif | chemical/x-cif | .cif |
| poscar | text/plain | .vasp |
| xyz | chemical/x-xyz | .xyz |

The \`Content-Disposition\` header includes a suggested filename:

\`\`\`
Content-Disposition: attachment; filename="Si_mp-149.cif"
\`\`\`

### CIF Output

The CIF file includes unit cell parameters, space group, symmetry operations, and atomic positions in fractional coordinates. Compatible with VESTA, Mercury, CrystalMaker, and all major DFT codes.

### POSCAR Output

VASP-compatible POSCAR with:

- Comment line with formula and material ID
- Universal scaling factor (1.0)
- Lattice vectors in Angstroms
- Element symbols and atom counts
- Fractional coordinates (Direct format)

### XYZ Output

Simple Cartesian coordinate format with element symbols and x, y, z positions in Angstroms. Suitable for molecular visualization and non-periodic calculations.

### Python SDK

\`\`\`python
from matcraft import MatCraftClient

client = MatCraftClient()
client.export_structure("mp-149", format="poscar", path="Si.vasp")
\`\`\`

### Error Responses

| Status | When |
|--------|------|
| 404 | Material ID not found |
| 400 | Unsupported export format |
`,
};

export default page;
