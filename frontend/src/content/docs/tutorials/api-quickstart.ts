import { DocPage } from "../index";

const page: DocPage = {
  slug: "api-quickstart",
  title: "API Quickstart",
  description: "Make your first MatCraft API call in Python, JavaScript, or curl in under 5 minutes.",
  category: "tutorials",
  order: 8,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "api", "python", "quickstart"],
  readingTime: 5,
  body: `
## API Quickstart

This tutorial gets you making MatCraft API calls in under 5 minutes. No account required for basic queries.

### With curl

The simplest way to test the API:

\`\`\`bash
# Search for silicon materials
curl "https://matcraft.io/api/materials?search=Si&per_page=3"

# Get a specific material
curl "https://matcraft.io/api/materials/mp-149"

# Download a CIF file
curl -O "https://matcraft.io/api/materials/mp-149/export/cif"
\`\`\`

### With Python (requests)

\`\`\`python
import requests

# Search for stable oxides with band gap 1-2 eV
response = requests.get("https://matcraft.io/api/materials", params={
    "elements": "O",
    "band_gap_min": 1.0,
    "band_gap_max": 2.0,
    "e_above_hull_max": 0.05,
    "sort": "band_gap",
    "per_page": 10
})

data = response.json()
print(f"Found {data['meta']['total']} materials")

for mat in data["data"]:
    print(f"{mat['formula']:20s} Eg={mat['band_gap']:.2f} eV  Ehull={mat['e_above_hull']:.3f}")
\`\`\`

### With the MatCraft Python SDK

The SDK provides a higher-level interface:

\`\`\`python
pip install matcraft
\`\`\`

\`\`\`python
from matcraft import MatCraftClient

client = MatCraftClient()  # no token needed for basic queries

# Search
results = client.search(elements=["Li", "Fe", "O"], band_gap_max=3.0, limit=20)
for mat in results:
    print(f"{mat.formula} - {mat.band_gap} eV")

# Get detail
si = client.get_material("mp-149")
print(si.crystal_system)  # "cubic"
print(si.space_group)     # "Fd-3m"

# Export structure
si.export("poscar", path="Si.vasp")

# Get band structure
bs = client.get_band_structure("mp-149")
bs.plot()  # matplotlib plot
\`\`\`

### With JavaScript (fetch)

\`\`\`javascript
const response = await fetch(
  "https://matcraft.io/api/materials?search=GaAs&per_page=5"
);
const { data, meta } = await response.json();

console.log(\`Found \${meta.total} results\`);
data.forEach(mat => {
  console.log(\`\${mat.formula}: Eg = \${mat.band_gap} eV\`);
});
\`\`\`

### Authentication for Higher Limits

Guest access allows 100 requests/hour. For more:

1. Create an account at matcraft.io
2. Go to Settings > API Keys
3. Generate a token

\`\`\`python
client = MatCraftClient(token="your-jwt-token-here")
# Now you get 1,000 requests/hour and access to builder tools
\`\`\`

Or with curl:

\`\`\`bash
curl "https://matcraft.io/api/materials" \\
  -H "Authorization: Bearer your-jwt-token-here"
\`\`\`

### Next Steps

- [API Overview](/docs/materials-api/overview) -- Full API conventions and error handling
- [List Materials](/docs/materials-api/materials-list) -- Complete filter parameter reference
- [Builder Tools](/docs/materials-api/builder-supercell) -- Create derivative structures programmatically
`,
};

export default page;
