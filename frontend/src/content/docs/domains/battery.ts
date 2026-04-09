import { DocPage } from "../index";

const page: DocPage = {
  slug: "battery",
  title: "Lithium-Ion Batteries",
  description: "Optimize cathode composition, electrolyte formulations, and cell design.",
  category: "domains",
  order: 2,
  lastUpdated: "2026-04-01",
  tags: ["battery", "lithium-ion", "cathode", "energy-storage"],
  readingTime: 7,
  body: `
## Lithium-Ion Battery Domain

The \`battery\` domain provides evaluation models for lithium-ion cell components, including cathode composition (NMC, NCA, LFP), anode blending (silicon-graphite), and electrolyte formulation. The physics models are based on electrochemical intercalation theory and empirical degradation correlations.

### Physics Model

- **Specific capacity** is calculated from stoichiometric lithium content and redox couple voltages using the Nernst equation with activity corrections for mixed transition metal oxides.
- **Energy density** combines capacity with average discharge voltage, accounting for polarization losses from charge transfer resistance and solid-state diffusion.
- **Cycle life** is estimated using a semi-empirical degradation model that accounts for SEI growth (proportional to sqrt(cycles)), transition metal dissolution (proportional to Ni content), and structural fatigue from lattice volume change during cycling.
- **Cost** is computed from raw material prices (Ni, Co, Mn, Li) and processing costs scaled by calcination temperature and time.

### Default Parameters

| Parameter | Type | Bounds | Unit | Description |
|-----------|------|--------|------|-------------|
| \`ni_content\` | continuous | [0.33, 0.90] | -- | Nickel fraction in NMC |
| \`mn_content\` | continuous | [0.05, 0.34] | -- | Manganese fraction |
| \`co_content\` | continuous | [0.05, 0.34] | -- | Cobalt fraction |
| \`calcination_temp\` | integer | [700, 950] | C | Synthesis temperature |
| \`calcination_time\` | continuous | [4.0, 24.0] | hours | Synthesis duration |
| \`coating_thickness\` | continuous | [0.0, 5.0] | nm | Protective oxide coating |
| \`particle_size\` | continuous | [3.0, 20.0] | um | Secondary particle diameter |
| \`electrolyte\` | categorical | [EC-DMC, EC-DEC, EC-EMC, FEC-DMC] | -- | Solvent system |

### Default Objectives

| Objective | Direction | Unit |
|-----------|-----------|------|
| \`specific_capacity\` | maximize | mAh/g |
| \`capacity_retention\` | maximize | % (after 500 cycles) |
| \`cobalt_cost\` | minimize | USD/kWh |

### Templates

\`\`\`bash
materia init my-nmc --template battery/nmc-cathode
materia init my-electrolyte --template battery/solid-electrolyte
materia init my-anode --template battery/anode-design
\`\`\`

### Key Trade-Offs

The battery domain exhibits several well-known trade-offs:

- **Ni content vs. stability**: Higher nickel content (NMC811, NMC9050505) delivers higher capacity but suffers from structural instability, cation mixing, and surface degradation.
- **Capacity vs. cycle life**: Aggressive cycling to high voltage (4.5V+) extracts more capacity but accelerates degradation.
- **Performance vs. cost**: Cobalt provides structural stability but is expensive and supply-constrained. Minimizing cobalt while maintaining performance is a primary industry goal.

### Example: NMC Cathode Optimization

\`\`\`yaml
name: nmc-cathode-screen
domain: battery

parameters:
  - name: ni_content
    type: continuous
    bounds: [0.50, 0.90]
  - name: mn_content
    type: continuous
    bounds: [0.05, 0.25]
  - name: co_content
    type: continuous
    bounds: [0.05, 0.25]
  - name: calcination_temp
    type: integer
    bounds: [750, 900]
  - name: coating_thickness
    type: continuous
    bounds: [0.0, 3.0]

objectives:
  - name: specific_capacity
    direction: maximize
    unit: mAh/g
  - name: capacity_retention
    direction: maximize
    unit: "%"
  - name: cobalt_cost
    direction: minimize
    unit: USD/kWh

constraints:
  - expression: ni_content + mn_content + co_content <= 1.0

optimizer:
  method: cma-es
  budget: 400
  batch_size: 20
  seed: 42
\`\`\`

### Typical Results

A well-converged NMC cathode campaign typically finds Pareto solutions spanning:

- **High-capacity end**: NMC811-like compositions with 195+ mAh/g but ~80% retention after 500 cycles
- **High-stability end**: NMC532-like compositions with 160 mAh/g but >95% retention
- **Low-cost end**: Cobalt-lean compositions (Co < 0.08) with moderate capacity and stability

### Programmatic Access

\`\`\`python
from materia.plugins.battery import BatteryDomain

domain = BatteryDomain()
result = domain.evaluate({
    "ni_content": 0.8,
    "mn_content": 0.1,
    "co_content": 0.1,
    "calcination_temp": 850,
    "coating_thickness": 2.0,
})
print(result)
# {"specific_capacity": 195.2, "capacity_retention": 82.1, "cobalt_cost": 12.4}
\`\`\`
`,
};

export default page;
