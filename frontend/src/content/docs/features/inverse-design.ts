import { DocPage } from "../index";

const page: DocPage = {
  slug: "inverse-design",
  title: "AI Inverse Design",
  description: "Specify target material properties and let AI rank candidate materials from the database.",
  category: "features",
  order: 3,
  lastUpdated: "2026-04-10",
  tags: ["inverse-design", "ai", "discovery", "machine-learning"],
  readingTime: 5,
  body: `
## AI Inverse Design

Traditional materials search starts with a composition and looks up its properties. Inverse design flips this: you specify the properties you want, and MatCraft ranks materials from its database by how closely they match your targets.

### How It Works

1. **Define target properties**: Set desired values for band gap, density, formation energy, or any other available property
2. **Set importance weights**: Assign relative importance to each property (0.0 to 1.0)
3. **Choose constraints**: Optionally require specific elements, crystal systems, or stability thresholds
4. **Run the search**: MatCraft scores all 205k+ materials against your target profile
5. **Review ranked results**: Materials are sorted by a weighted distance score, with the best matches at the top

### Scoring Algorithm

The ranking uses a normalized weighted Euclidean distance:

\`\`\`
score = sum(w_i * ((p_i - target_i) / range_i)^2)
\`\`\`

Where \`w_i\` is the weight for property i, \`p_i\` is the material's property value, \`target_i\` is your target, and \`range_i\` is the property's range across the database for normalization.

### Example Use Cases

- **Solar absorber**: Target band gap 1.1-1.5 eV, low Ehull, density < 6 g/cm3
- **Wide-gap semiconductor**: Target band gap 3.0-5.0 eV, cubic crystal system
- **Lightweight structural**: Target high bulk modulus, density < 4 g/cm3, Ehull < 0.05 eV/atom

### Using the Interface

Navigate to the Inverse Design tab from any materials page. The interface presents property sliders for each target value and weight. Results update in real-time as you adjust parameters.

### API Access

\`\`\`python
import requests

response = requests.post("https://matcraft.io/api/materials/inverse-design", json={
    "targets": {
        "band_gap": {"value": 1.4, "weight": 1.0},
        "density": {"value": 3.0, "weight": 0.5},
        "e_above_hull": {"value": 0.0, "weight": 0.8}
    },
    "constraints": {
        "must_contain": ["Si"],
        "max_elements": 3
    },
    "limit": 50
})

candidates = response.json()["results"]
\`\`\`

### Limitations

Inverse design searches within the existing database -- it does not generate novel compositions. For truly generative design, combine inverse design results with the optimization campaign workflow to explore nearby composition spaces around top candidates.
`,
};

export default page;
