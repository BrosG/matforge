import { DocPage } from "../index";

const page: DocPage = {
  slug: "hydrogen",
  title: "Hydrogen Storage",
  description: "Optimize hydrogen storage materials including metal hydrides and MOFs.",
  category: "domains",
  order: 5,
  lastUpdated: "2026-04-01",
  tags: ["hydrogen", "storage", "metal-hydride", "MOF"],
  readingTime: 6,
  body: `
## Hydrogen Storage Domain

The \`hydrogen\` domain provides evaluation models for hydrogen storage materials, including interstitial metal hydrides, complex hydrides, metal-organic frameworks (MOFs), and chemical hydrogen carriers.

### Physics Model

- **Gravimetric capacity** is calculated from the stoichiometry of the hydrogen-bearing phase, accounting for molecular weights and the maximum hydrogen-to-metal ratio.
- **Desorption temperature** is derived from the van't Hoff equation using formation enthalpies estimated via the Miedema model with DFT-calibrated corrections.
- **Kinetics** are modeled using Johnson-Mehl-Avrami-Kolmogorov (JMAK) nucleation-and-growth kinetics, with rate constants dependent on particle size, catalyst doping, and temperature.

### Default Parameters

| Parameter | Type | Bounds | Unit | Description |
|-----------|------|--------|------|-------------|
| \`host_metal_a\` | categorical | [Ti, Zr, V, La, Mg] | -- | Primary metal |
| \`host_metal_b\` | categorical | [Ni, Fe, Mn, Co, Cr] | -- | Secondary metal |
| \`a_b_ratio\` | continuous | [0.5, 3.0] | -- | A:B stoichiometric ratio |
| \`catalyst_dopant\` | categorical | [none, Pd, Pt, Nb, V] | -- | Catalytic additive |
| \`dopant_wt_pct\` | continuous | [0.0, 5.0] | wt% | Dopant concentration |
| \`ball_mill_time\` | continuous | [0.5, 48.0] | hours | Mechanical activation |
| \`particle_size\` | continuous | [0.1, 100.0] | um | Mean particle diameter |

### Default Objectives

| Objective | Direction | Unit |
|-----------|-----------|------|
| \`gravimetric_capacity\` | maximize | wt% H2 |
| \`desorption_temp\` | minimize | C |
| \`absorption_rate\` | maximize | wt%/min |

### Key Trade-Offs

- **Capacity vs. desorption temperature**: Materials with stronger metal-hydrogen bonds have higher capacities but require more heat to release hydrogen. The DOE target is >5.5 wt% at <85 C.
- **Kinetics vs. capacity**: Nanostructuring and doping improve kinetics but can reduce reversible capacity through surface oxidation.
- **Gravimetric vs. volumetric capacity**: Light metals (Mg, Li) offer high gravimetric capacity but low density limits volumetric performance.

### Example: MgH2-Based System

\`\`\`yaml
name: mg-hydride-optimization
domain: hydrogen

parameters:
  - name: host_metal_b
    type: categorical
    choices: [Ni, Fe, Ti, V]
  - name: a_b_ratio
    type: continuous
    bounds: [1.5, 2.5]
  - name: catalyst_dopant
    type: categorical
    choices: [none, Nb, V, Pd]
  - name: dopant_wt_pct
    type: continuous
    bounds: [0.0, 3.0]
  - name: ball_mill_time
    type: continuous
    bounds: [1.0, 24.0]

objectives:
  - name: gravimetric_capacity
    direction: maximize
    unit: wt%
  - name: desorption_temp
    direction: minimize
    unit: C

optimizer:
  method: cma-es
  budget: 300
  batch_size: 15
\`\`\`

### MOF Storage Mode

For metal-organic frameworks, the parameter space shifts to linker chemistry and pore geometry:

\`\`\`yaml
parameters:
  - name: pore_diameter
    type: continuous
    bounds: [5.0, 30.0]
    unit: angstrom
  - name: surface_area
    type: continuous
    bounds: [500, 7000]
    unit: m2/g
  - name: framework_density
    type: continuous
    bounds: [0.1, 1.5]
    unit: g/cm3
\`\`\`

The MOF evaluation model uses grand canonical Monte Carlo (GCMC)-derived isotherms parameterized by pore geometry.

### Typical Results

MgH2-based campaigns typically discover:

- **Pure MgH2**: 7.6 wt% capacity, desorption above 300 C, slow kinetics
- **Nb-catalyzed MgH2**: 6.5 wt%, desorption at ~250 C, fast absorption
- **MgNi alloys**: 3.6 wt%, desorption below 200 C, moderate kinetics

The Pareto front reveals the fundamental trade-off between capacity and practical operating temperatures.
`,
};

export default page;
