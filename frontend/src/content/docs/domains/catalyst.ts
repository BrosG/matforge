import { DocPage } from "../index";

const page: DocPage = {
  slug: "catalyst",
  title: "Catalysts",
  description: "Optimize heterogeneous and electrocatalyst composition and processing.",
  category: "domains",
  order: 4,
  lastUpdated: "2026-04-01",
  tags: ["catalyst", "heterogeneous", "electrocatalysis", "chemical"],
  readingTime: 7,
  body: `
## Catalyst Domain

The \`catalyst\` domain provides evaluation models for heterogeneous catalysts and electrocatalysts. It supports optimization of supported metal catalysts, bimetallic systems, and metal oxide catalysts for reactions including CO2 hydrogenation, ammonia synthesis, water splitting, and selective oxidation.

### Physics Model

- **Activity (turnover frequency)** is modeled using Sabatier-principle-based volcano curves. The binding energy of key intermediates is estimated from composition using linear scaling relations from DFT databases.
- **Selectivity** is derived from the relative rates of competing pathways, modeled as Arrhenius rate expressions with activation energies that depend on the catalyst surface composition and structure.
- **Stability (deactivation rate)** accounts for sintering (Ostwald ripening), poisoning, and leaching using empirical models parameterized by metal type, particle size, support, and operating temperature.

### Default Parameters

| Parameter | Type | Bounds | Unit | Description |
|-----------|------|--------|------|-------------|
| \`metal_a_loading\` | continuous | [1.0, 40.0] | wt% | Primary metal loading |
| \`metal_b_loading\` | continuous | [0.0, 20.0] | wt% | Secondary metal loading |
| \`support\` | categorical | [alumina, silica, titania, ceria, carbon] | -- | Support material |
| \`calcination_temp\` | integer | [300, 800] | C | Calcination temperature |
| \`reduction_temp\` | integer | [150, 500] | C | Reduction temperature |
| \`particle_size\` | continuous | [1.0, 50.0] | nm | Target metal particle size |

### Default Objectives

| Objective | Direction | Unit |
|-----------|-----------|------|
| \`activity\` | maximize | mol/(g_cat*h) |
| \`selectivity\` | maximize | % |
| \`stability\` | maximize | hours (to 10% deactivation) |

### Templates

\`\`\`bash
materia init my-cat --template catalyst/haber-bosch
materia init my-oer --template catalyst/water-splitting
materia init my-co2 --template catalyst/co2-reduction
\`\`\`

### Key Trade-Offs

- **Activity vs. selectivity**: Highly active catalysts often drive side reactions. For example, in CO2 hydrogenation, catalysts with high CO2 conversion may produce unwanted CO rather than the target methanol.
- **Activity vs. stability**: Small nanoparticles with high surface area are more active but prone to sintering at elevated temperatures.
- **Noble metal loading vs. cost**: Platinum-group metals offer superior activity but minimizing their loading without sacrificing performance is critical for commercial viability.

### Example: Methanol Synthesis Catalyst

\`\`\`yaml
name: methanol-catalyst
domain: catalyst
description: Cu-Zn/Al2O3 for CO2-to-methanol

parameters:
  - name: cu_loading
    type: continuous
    bounds: [10.0, 35.0]
    unit: wt%
  - name: zn_loading
    type: continuous
    bounds: [5.0, 25.0]
    unit: wt%
  - name: support
    type: categorical
    choices: [alumina, silica, titania, ceria]
  - name: calcination_temp
    type: integer
    bounds: [350, 600]
  - name: reduction_temp
    type: integer
    bounds: [200, 350]
  - name: particle_size
    type: continuous
    bounds: [2.0, 30.0]
    unit: nm

objectives:
  - name: methanol_selectivity
    direction: maximize
    unit: "%"
  - name: co2_conversion
    direction: maximize
    unit: "%"
  - name: stability_hours
    direction: maximize
    unit: hours

constraints:
  - expression: cu_loading + zn_loading <= 50
    description: Maximum total metal loading

optimizer:
  method: cma-es
  budget: 400
  batch_size: 20
\`\`\`

### Electrocatalysis Mode

For electrochemical reactions (OER, HER, CO2RR), additional parameters control the electrochemical environment:

\`\`\`yaml
parameters:
  - name: applied_potential
    type: continuous
    bounds: [-1.5, 0.5]
    unit: V vs. RHE
  - name: electrolyte_pH
    type: continuous
    bounds: [0.0, 14.0]
\`\`\`

The electrocatalysis evaluation model uses Butler-Volmer kinetics with Tafel slopes estimated from the binding energetics.

### Volcano Plot Analysis

After optimization, MatCraft can generate a volcano plot showing the relationship between binding energy and activity across all evaluated catalysts:

\`\`\`bash
materia results --volcano-plot --descriptor binding_energy
\`\`\`

This helps identify the optimal binding energy region and which compositions fall near the volcano peak.
`,
};

export default page;
