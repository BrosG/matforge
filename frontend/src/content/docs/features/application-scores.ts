import { DocPage } from "../index";

const page: DocPage = {
  slug: "application-scores",
  title: "Application Suitability Scores",
  description: "AI-estimated suitability scores for solar, battery, catalyst, thermoelectric, and other applications.",
  category: "features",
  order: 11,
  lastUpdated: "2026-04-10",
  tags: ["application", "suitability", "scoring", "ai"],
  readingTime: 4,
  body: `
## Application Suitability Scores

MatCraft assigns AI-estimated suitability scores to each material for common engineering applications. These scores help researchers quickly identify which materials are worth investigating for a specific use case.

### Available Applications

| Application | Key Properties Used |
|-------------|-------------------|
| Solar absorber | Band gap (1.0-1.8 eV ideal), direct gap preference, absorption coefficient |
| Battery cathode | Voltage, capacity, stability (Ehull), contains Li + transition metal |
| Catalyst | d-band center, surface energy, formation energy, transition metal content |
| Thermoelectric | Band gap (0.1-1.0 eV), effective mass, expected lattice thermal conductivity |
| LED / phosphor | Direct band gap in visible range, wide-gap host lattice |
| Transparent conductor | Wide band gap (> 3 eV), expected carrier mobility |
| Hard coating | Bulk/shear modulus, Pugh ratio, Vickers hardness estimate |
| Piezoelectric | Non-centrosymmetric space group, contains electropositive + electronegative elements |

### How Scores Are Calculated

Each application has a scoring function that combines relevant material properties using domain-specific heuristics:

1. **Property extraction**: Gather band gap, formation energy, Ehull, density, crystal system, composition
2. **Criteria matching**: Check hard requirements (e.g., band gap range for solar)
3. **Weighted scoring**: Apply a weighted sum of normalized property distances from ideal values
4. **Normalization**: Scale to 0-100 where 100 is the best possible match

### Viewing Scores

Application scores appear on each material's detail page in the **Applications** panel. Scores are color-coded:

- **Green (70-100)**: Strong candidate, worth detailed investigation
- **Yellow (40-69)**: Moderate potential, may need further screening
- **Red (0-39)**: Poor match for this application

### Limitations

These scores are heuristic estimates based on computed bulk properties. They do not account for:

- Surface properties (critical for catalysis)
- Defect chemistry
- Synthesis feasibility
- Cost and availability of constituent elements
- Environmental and toxicity considerations

Always validate top candidates with more detailed calculations or experimental testing.

### Sorting by Application Score

In the materials search view, you can sort results by any application score to surface the most promising candidates for your target application.
`,
};

export default page;
