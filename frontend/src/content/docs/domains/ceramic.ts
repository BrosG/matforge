import { DocPage } from "../index";

const page: DocPage = {
  slug: "ceramic",
  title: "Ceramics",
  description: "Optimize structural and functional ceramics for ionic conductivity, toughness, and thermal resistance.",
  category: "domains",
  order: 8,
  lastUpdated: "2026-04-01",
  tags: ["ceramic", "oxide", "ionic-conductor", "structural"],
  readingTime: 6,
  body: `
## Ceramic Domain

The \`ceramic\` domain provides evaluation models for structural and functional ceramic materials, including solid oxide fuel cell electrolytes, thermal barrier coatings, structural alumina/zirconia, and piezoelectric ceramics.

### Physics Model

- **Ionic conductivity** is modeled using the Arrhenius equation with activation energies estimated from dopant type, concentration, and crystal structure. Oxygen vacancy concentration is derived from charge compensation requirements.
- **Fracture toughness** is calculated using a microstructure-dependent model accounting for transformation toughening (in zirconia), crack deflection, and grain size effects via the Hall-Petch-like relationship.
- **Thermal conductivity** is modeled using the Callaway model with phonon scattering from grain boundaries, point defects (dopants), and porosity.
- **Density** is estimated from sintering models (Coble sintering theory) accounting for temperature, time, and green body characteristics.

### Default Parameters

| Parameter | Type | Bounds | Unit | Description |
|-----------|------|--------|------|-------------|
| \`dopant_mol_pct\` | continuous | [0.0, 15.0] | mol% | Dopant concentration |
| \`dopant_type\` | categorical | [Y2O3, CeO2, Gd2O3, Sc2O3, MgO] | -- | Dopant oxide |
| \`sintering_temp\` | integer | [1100, 1700] | C | Sintering temperature |
| \`sintering_time\` | continuous | [0.5, 24.0] | hours | Hold time at temperature |
| \`grain_size\` | continuous | [0.1, 50.0] | um | Target grain diameter |
| \`porosity\` | continuous | [0.01, 0.30] | -- | Volume fraction porosity |

### Default Objectives

| Objective | Direction | Unit |
|-----------|-----------|------|
| \`ionic_conductivity\` | maximize | S/cm |
| \`fracture_toughness\` | maximize | MPa*m^0.5 |

### Key Trade-Offs

- **Conductivity vs. mechanical strength**: Higher dopant concentrations increase ionic conductivity by creating more oxygen vacancies but can destabilize the crystal structure, reducing toughness.
- **Density vs. conductivity**: Full densification improves mechanical properties but can trap dopants in unfavorable configurations. Some controlled porosity can improve gas-phase transport in SOFCs.
- **Grain size effects**: Larger grains improve ionic conductivity (less grain boundary resistance) but reduce fracture toughness (less crack deflection).

### Example: SOFC Electrolyte

\`\`\`yaml
name: ysz-electrolyte
domain: ceramic

parameters:
  - name: dopant_mol_pct
    type: continuous
    bounds: [3.0, 12.0]
  - name: dopant_type
    type: categorical
    choices: [Y2O3, Sc2O3, Gd2O3]
  - name: sintering_temp
    type: integer
    bounds: [1300, 1600]
  - name: sintering_time
    type: continuous
    bounds: [2.0, 16.0]
  - name: grain_size
    type: continuous
    bounds: [0.5, 10.0]

objectives:
  - name: ionic_conductivity
    direction: maximize
    unit: S/cm
  - name: fracture_toughness
    direction: maximize
    unit: MPa*m^0.5

optimizer:
  method: cma-es
  budget: 300
  batch_size: 15
  seed: 42
\`\`\`

### Typical Results

YSZ electrolyte campaigns find:

- **8 mol% YSZ** (classic composition): Conductivity ~0.1 S/cm at 1000 C, toughness ~2.5 MPa*m^0.5
- **Sc-doped ZrO2**: Higher conductivity (~0.15 S/cm) but lower toughness (~1.8 MPa*m^0.5)
- **Co-doped systems**: Intermediate performance with improved sinterability at lower temperatures

### Thermal Barrier Coating Mode

For TBC applications, the evaluation model shifts to thermal resistance and thermal cycling durability:

\`\`\`yaml
objectives:
  - name: thermal_resistance
    direction: maximize
    unit: m2*K/W
  - name: cycling_lifetime
    direction: maximize
    unit: cycles
\`\`\`

Parameters include coating thickness, bond coat composition, and spray deposition conditions.
`,
};

export default page;
