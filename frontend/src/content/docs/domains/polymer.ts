import { DocPage } from "../index";

const page: DocPage = {
  slug: "polymer",
  title: "Polymers",
  description: "Optimize polymer blends, composites, and processing conditions.",
  category: "domains",
  order: 7,
  lastUpdated: "2026-04-01",
  tags: ["polymer", "blend", "composite", "mechanical"],
  readingTime: 6,
  body: `
## Polymer Domain

The \`polymer\` domain provides evaluation models for polymer blends, filled composites, and coatings. It covers thermoplastics, thermosets, and elastomer formulations with processing condition optimization.

### Physics Model

- **Tensile strength** is modeled using a modified rule of mixtures with interaction parameters from Flory-Huggins theory for blends and Halpin-Tsai equations for filled composites.
- **Elongation at break** combines empirical correlations with blend morphology predictions from viscosity ratio and interfacial tension estimates.
- **Glass transition temperature (Tg)** is calculated using the Fox equation for miscible blends and empirical models for semi-crystalline systems with processing-dependent crystallinity.
- **Impact strength** uses a crack propagation model accounting for rubber toughening, filler debonding, and matrix ductility.

### Default Parameters

| Parameter | Type | Bounds | Unit | Description |
|-----------|------|--------|------|-------------|
| \`polymer_a_fraction\` | continuous | [0.1, 0.9] | wt% | Primary polymer content |
| \`filler_loading\` | continuous | [0.0, 0.40] | wt% | Mineral or fiber filler |
| \`filler_type\` | categorical | [glass_fiber, carbon_fiber, talc, calcium_carbonate, nanoclay] | -- | Filler material |
| \`processing_temp\` | continuous | [150, 350] | C | Extrusion/molding temperature |
| \`cooling_rate\` | categorical | [slow, medium, fast, quench] | -- | Cooling protocol |
| \`draw_ratio\` | continuous | [1.0, 8.0] | -- | Uniaxial stretch ratio |

### Default Objectives

| Objective | Direction | Unit |
|-----------|-----------|------|
| \`tensile_strength\` | maximize | MPa |
| \`elongation_at_break\` | maximize | % |
| \`impact_strength\` | maximize | kJ/m2 |

### Key Trade-Offs

- **Strength vs. ductility**: The classic materials trade-off. Higher crystallinity and filler loading increase strength but reduce elongation and impact resistance.
- **Stiffness vs. toughness**: Glass fiber reinforcement increases modulus but reduces fracture toughness.
- **Processing temperature vs. properties**: Higher melt temperatures improve flow and mixing but may cause thermal degradation.

### Example: Toughened Engineering Plastic

\`\`\`yaml
name: toughened-nylon
domain: polymer

parameters:
  - name: polymer_a_fraction
    type: continuous
    bounds: [0.5, 0.9]
    description: Nylon 6,6 fraction
  - name: filler_loading
    type: continuous
    bounds: [0.0, 0.30]
  - name: filler_type
    type: categorical
    choices: [glass_fiber, carbon_fiber, nanoclay]
  - name: processing_temp
    type: continuous
    bounds: [260, 310]
    unit: C
  - name: cooling_rate
    type: categorical
    choices: [slow, medium, fast]

objectives:
  - name: tensile_strength
    direction: maximize
    unit: MPa
  - name: impact_strength
    direction: maximize
    unit: kJ/m2

optimizer:
  method: cma-es
  budget: 250
  batch_size: 12
\`\`\`

### Typical Results

Toughened polymer campaigns show:

- **High-strength solutions**: 30% glass fiber, slow cooling -> 180 MPa strength, 8 kJ/m2 impact
- **High-impact solutions**: 5% nanoclay, fast cooling -> 75 MPa strength, 45 kJ/m2 impact
- **Balanced solutions**: 15% glass fiber, medium cooling -> 120 MPa strength, 22 kJ/m2 impact

### Blend Morphology Prediction

The polymer domain includes a blend morphology predictor that estimates phase structure (dispersed, co-continuous, or lamellar) from composition and processing conditions. This information is included in the results:

\`\`\`bash
materia results --show-metadata
\`\`\`

Morphology predictions help interpret why certain compositions exhibit unexpected property jumps.
`,
};

export default page;
