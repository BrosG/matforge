import { DocPage } from "../index";

const page: DocPage = {
  slug: "examples",
  title: "MDL Examples",
  description: "Complete MDL examples for various material optimization scenarios.",
  category: "mdl",
  order: 7,
  lastUpdated: "2026-04-01",
  tags: ["mdl", "examples", "recipes"],
  readingTime: 9,
  body: `
## MDL Examples

This page provides complete, ready-to-use MDL examples for various material optimization scenarios. Each example includes inline comments explaining the design choices.

### Example 1: Polymer Blend Optimization

Optimizing a two-component polymer blend for tensile strength and elongation at break:

\`\`\`yaml
name: polymer-blend-v1
domain: polymer
description: Binary polymer blend for packaging film

parameters:
  - name: polymer_a_fraction
    type: continuous
    bounds: [0.2, 0.8]
    description: Weight fraction of high-density polyethylene

  - name: processing_temp
    type: continuous
    bounds: [150, 280]
    unit: C
    description: Extrusion temperature

  - name: draw_ratio
    type: continuous
    bounds: [2.0, 8.0]
    description: Uniaxial draw ratio

  - name: cooling_rate
    type: categorical
    choices: [slow, medium, fast, quench]
    description: Post-extrusion cooling method

objectives:
  - name: tensile_strength
    direction: maximize
    unit: MPa

  - name: elongation_at_break
    direction: maximize
    unit: "%"

optimizer:
  method: cma-es
  budget: 200
  seed: 101
\`\`\`

### Example 2: Solid Oxide Fuel Cell Electrolyte

Screening doped zirconia compositions for ionic conductivity and mechanical stability:

\`\`\`yaml
name: sofc-electrolyte
domain: ceramic
description: Yttria-stabilized zirconia electrolyte

parameters:
  - name: yttria_mol_pct
    type: continuous
    bounds: [3.0, 12.0]
    unit: mol%
    description: Yttria dopant concentration

  - name: sintering_temp
    type: integer
    bounds: [1200, 1600]
    unit: C

  - name: sintering_time_h
    type: continuous
    bounds: [1.0, 24.0]
    unit: hours

  - name: grain_size_target
    type: continuous
    bounds: [0.1, 10.0]
    unit: um

objectives:
  - name: ionic_conductivity
    direction: maximize
    unit: S/cm
    description: Oxide ion conductivity at 800C

  - name: fracture_toughness
    direction: maximize
    unit: MPa*m^0.5

constraints:
  - expression: sintering_temp >= 1300
    description: Minimum temp for full densification

optimizer:
  method: cma-es
  budget: 250
  batch_size: 12
  surrogate: mlp
  seed: 42
\`\`\`

### Example 3: Heterogeneous Catalyst

Optimizing a bimetallic catalyst for selectivity and conversion in CO2 hydrogenation:

\`\`\`yaml
name: co2-hydrogenation-catalyst
domain: catalyst
description: Cu-Zn/Al2O3 catalyst for methanol synthesis

parameters:
  - name: cu_loading
    type: continuous
    bounds: [5.0, 40.0]
    unit: wt%

  - name: zn_loading
    type: continuous
    bounds: [5.0, 30.0]
    unit: wt%

  - name: calcination_temp
    type: integer
    bounds: [300, 600]
    unit: C

  - name: reduction_temp
    type: integer
    bounds: [200, 400]
    unit: C

  - name: support
    type: categorical
    choices: [alumina, silica, titania, ceria]

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
    description: Time to 10% activity loss

constraints:
  - expression: cu_loading + zn_loading <= 60
    description: Total metal loading limit

optimizer:
  method: cma-es
  budget: 400
  batch_size: 20
\`\`\`

### Example 4: Single-Objective with Constraints

Sometimes you only care about one property, subject to feasibility constraints:

\`\`\`yaml
name: thermal-barrier-coating
domain: ceramic
description: Maximize thermal resistance within CTE limits

parameters:
  - name: ysz_thickness
    type: continuous
    bounds: [50, 500]
    unit: um

  - name: bond_coat_thickness
    type: continuous
    bounds: [20, 150]
    unit: um

  - name: porosity
    type: continuous
    bounds: [0.05, 0.30]

  - name: spray_distance
    type: continuous
    bounds: [80, 150]
    unit: mm

objectives:
  - name: thermal_resistance
    direction: maximize
    unit: m2*K/W

constraints:
  - expression: ysz_thickness + bond_coat_thickness <= 600
    description: Maximum total coating thickness
  - expression: porosity <= 0.25
    description: Structural integrity limit

optimizer:
  method: cma-es
  budget: 150
  seed: 7
\`\`\`

### Example 5: High-Dimensional Design Space

A thermoelectric material with many design variables:

\`\`\`yaml
name: thermoelectric-screen
domain: thermoelectric
description: Bi2Te3-based thermoelectric for room temperature

parameters:
  - name: bi_fraction
    type: continuous
    bounds: [0.35, 0.45]
  - name: sb_substitution
    type: continuous
    bounds: [0.0, 0.10]
  - name: se_substitution
    type: continuous
    bounds: [0.0, 0.10]
  - name: dopant_concentration
    type: continuous
    bounds: [0.001, 0.05]
    log_scale: true
  - name: hot_press_temp
    type: integer
    bounds: [350, 550]
    unit: C
  - name: hot_press_pressure
    type: continuous
    bounds: [30, 80]
    unit: MPa
  - name: hot_press_time
    type: continuous
    bounds: [5, 60]
    unit: min
  - name: ball_mill_time
    type: continuous
    bounds: [1, 48]
    unit: hours
  - name: annealing_temp
    type: integer
    bounds: [200, 400]
    unit: C

objectives:
  - name: zt
    direction: maximize
    description: Thermoelectric figure of merit at 300K
  - name: power_factor
    direction: maximize
    unit: uW/(cm*K2)

optimizer:
  method: cma-es
  budget: 600
  batch_size: 25
  surrogate: mlp
  seed: 2026
\`\`\`

### Tips for Writing MDL Files

1. **Start with a template** and customize rather than writing from scratch.
2. **Use descriptive names** that match your lab terminology.
3. **Include units** in the description or unit field for clarity.
4. **Set a seed** for reproducible results during development.
5. **Start with a small budget** (50-100) to verify the setup, then increase for production runs.
`,
};

export default page;
