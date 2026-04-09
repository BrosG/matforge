import { DocPage } from "../index";

const page: DocPage = {
  slug: "water",
  title: "Water Membranes",
  description: "Optimize reverse osmosis, ultrafiltration, and forward osmosis membranes.",
  category: "domains",
  order: 1,
  lastUpdated: "2026-04-01",
  tags: ["water", "membrane", "desalination", "filtration"],
  readingTime: 7,
  body: `
## Water Membranes Domain

The \`water\` domain provides evaluation models for polymeric separation membranes used in water treatment and desalination. It covers reverse osmosis (RO), ultrafiltration (UF), and forward osmosis (FO) membrane design.

### Physics Model

The water domain's evaluation function combines the solution-diffusion model with structure-property correlations:

- **Permeability** is modeled using a modified Hagen-Poiseuille equation that accounts for pore size distribution, membrane thickness, porosity, and tortuosity.
- **Salt rejection** is modeled using the Kedem-Katchalsky transport equations with reflection coefficients derived from pore size relative to hydrated ion radii.
- **Mechanical strength** is estimated from polymer concentration, crosslink density, and thickness using empirical correlations from the membrane literature.

### Default Parameters

| Parameter | Type | Bounds | Unit | Description |
|-----------|------|--------|------|-------------|
| \`polymer_concentration\` | continuous | [0.08, 0.40] | wt% | Polymer in casting solution |
| \`crosslinker_ratio\` | continuous | [0.01, 0.15] | mol/mol | Crosslinker to monomer ratio |
| \`pore_size_nm\` | continuous | [0.3, 100.0] | nm | Mean pore diameter |
| \`membrane_thickness_um\` | continuous | [5.0, 300.0] | um | Active layer thickness |
| \`annealing_temp_c\` | continuous | [50.0, 180.0] | C | Post-treatment temperature |
| \`support_porosity\` | continuous | [0.20, 0.85] | -- | Substrate layer porosity |
| \`tmpc_concentration\` | continuous | [0.05, 0.50] | wt% | TMC monomer concentration |

### Default Objectives

| Objective | Direction | Unit | Description |
|-----------|-----------|------|-------------|
| \`permeability\` | maximize | L/(m2*h*bar) | Pure water permeability |
| \`salt_rejection\` | maximize | % | NaCl rejection at 15.5 bar |

### Templates

The water domain includes three templates:

\`\`\`bash
materia init my-ro --template water/ro-membrane
materia init my-uf --template water/uf-membrane
materia init my-fo --template water/forward-osmosis
\`\`\`

- **ro-membrane**: Reverse osmosis thin-film composite. 5 parameters, 2 objectives. Targets desalination-grade rejection (>97%).
- **uf-membrane**: Ultrafiltration membrane. 4 parameters, 2 objectives. Targets high flux with molecular weight cutoff control.
- **forward-osmosis**: FO draw solution and membrane co-optimization. 6 parameters, 2 objectives.

### Example Campaign

\`\`\`yaml
name: high-flux-ro
domain: water
description: Maximize permeability while maintaining >97% NaCl rejection

parameters:
  - name: polymer_concentration
    type: continuous
    bounds: [0.12, 0.30]
  - name: crosslinker_ratio
    type: continuous
    bounds: [0.03, 0.10]
  - name: pore_size_nm
    type: continuous
    bounds: [0.3, 5.0]
  - name: membrane_thickness_um
    type: continuous
    bounds: [20.0, 150.0]
  - name: annealing_temp_c
    type: continuous
    bounds: [70.0, 140.0]

objectives:
  - name: permeability
    direction: maximize
    unit: L/(m2*h*bar)
  - name: salt_rejection
    direction: maximize
    unit: "%"

constraints:
  - expression: membrane_thickness_um >= 30
    description: Minimum for mechanical handling

optimizer:
  method: cma-es
  budget: 250
  batch_size: 15
  seed: 42
\`\`\`

### Key Trade-Offs

The fundamental trade-off in membrane design is between permeability and selectivity. Larger pores increase flux but allow more solute to pass. The Pareto front of this domain typically shows:

- **High-rejection region** (>99%): Low permeability (~5-15 L/(m2*h*bar)), dense polymer matrices, small pores.
- **High-flux region** (>30 L/(m2*h*bar)): Lower rejection (91-95%), thinner membranes, larger pores.
- **Knee point**: Typically around 20 L/(m2*h*bar) permeability and 97% rejection.

### Validation Rules

The water domain enforces:

- Polymer concentration must be positive and less than 1.0
- Pore size must be positive
- Membrane thickness must be at least 5 micrometers
- Annealing temperature must be below the polymer degradation temperature

### Source Code

The water domain implementation is at \`materia/plugins/water/physics.py\`. The evaluation function and its physics model are documented inline.
`,
};

export default page;
