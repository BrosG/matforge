import { DocPage } from "../index";

const page: DocPage = {
  slug: "solar",
  title: "Solar Cells",
  description: "Optimize perovskite, organic, and tandem solar cell absorber layers.",
  category: "domains",
  order: 3,
  lastUpdated: "2026-04-01",
  tags: ["solar", "perovskite", "photovoltaic", "energy"],
  readingTime: 7,
  body: `
## Solar Cell Domain

The \`solar\` domain provides evaluation models for thin-film photovoltaic absorber layers, with a focus on halide perovskites (ABX3), organic photovoltaics (OPV), and two-junction tandem cells.

### Physics Model

- **Power conversion efficiency (PCE)** is calculated using the detailed balance (Shockley-Queisser) framework with corrections for non-radiative recombination losses. The bandgap is derived from composition using Vegard's law and bowing parameters from the perovskite literature.
- **Open-circuit voltage (Voc)** is estimated from the bandgap minus radiative and non-radiative voltage losses, where non-radiative losses depend on composition and film quality.
- **Stability (T80)** is modeled using Arrhenius-type degradation kinetics with composition-dependent activation energies. Cesium incorporation improves thermal stability; methylammonium fraction drives moisture-induced decomposition.

### Default Parameters

| Parameter | Type | Bounds | Unit | Description |
|-----------|------|--------|------|-------------|
| \`ma_fraction\` | continuous | [0.0, 1.0] | -- | Methylammonium A-site fraction |
| \`fa_fraction\` | continuous | [0.0, 1.0] | -- | Formamidinium A-site fraction |
| \`cs_fraction\` | continuous | [0.0, 0.20] | -- | Cesium A-site fraction |
| \`br_fraction\` | continuous | [0.0, 0.50] | -- | Bromide X-site fraction |
| \`film_thickness\` | continuous | [200, 800] | nm | Absorber layer thickness |
| \`annealing_temp\` | integer | [80, 160] | C | Film annealing temperature |
| \`antisolvent\` | categorical | [toluene, chlorobenzene, diethyl_ether] | -- | Antisolvent quenching agent |

### Default Objectives

| Objective | Direction | Unit |
|-----------|-----------|------|
| \`pce\` | maximize | % |
| \`stability_hours\` | maximize | hours (T80 under 1-sun) |

### Templates

\`\`\`bash
materia init my-perovskite --template solar/perovskite
materia init my-tandem --template solar/tandem-cell
materia init my-opv --template solar/organic-pv
\`\`\`

### Key Trade-Offs

- **Efficiency vs. stability**: Novel compositions (triple-cation, mixed-halide) can reach PCEs above 24%, but long-term stability under illumination and humidity remains challenging. Higher MA content boosts initial PCE but degrades faster.
- **Bandgap tuning**: Bromide incorporation widens the bandgap (useful for tandem top cells) but introduces halide segregation under illumination, reducing operational stability.
- **Film thickness**: Thicker films absorb more light but increase recombination losses and series resistance.

### Example: Triple-Cation Perovskite

\`\`\`yaml
name: triple-cation-perovskite
domain: solar

parameters:
  - name: ma_fraction
    type: continuous
    bounds: [0.0, 0.3]
  - name: fa_fraction
    type: continuous
    bounds: [0.5, 1.0]
  - name: cs_fraction
    type: continuous
    bounds: [0.05, 0.15]
  - name: br_fraction
    type: continuous
    bounds: [0.0, 0.3]
  - name: film_thickness
    type: continuous
    bounds: [300, 700]

objectives:
  - name: pce
    direction: maximize
    unit: "%"
  - name: stability_hours
    direction: maximize
    unit: hours

constraints:
  - expression: ma_fraction + fa_fraction + cs_fraction <= 1.0

optimizer:
  method: cma-es
  budget: 350
  seed: 42
\`\`\`

### Typical Results

Well-optimized campaigns discover compositions near the known high-performance region:

- **High-PCE solutions**: FA-rich compositions (FA > 0.8) with small Cs addition (0.05-0.10) and minimal Br, achieving PCE of 22-25%.
- **High-stability solutions**: Cs-rich, low-MA compositions with higher Br content, achieving T80 of 2000+ hours but lower PCE (17-20%).
- **Balanced solutions**: FA~0.75/MA~0.10/Cs~0.10 with Br~0.10, achieving PCE ~21% and T80 ~1000 hours.

### Tandem Cell Mode

The tandem template optimizes both top and bottom cell compositions simultaneously, adding parameters for the wide-bandgap top cell and current-matching constraints:

\`\`\`yaml
constraints:
  - expression: br_fraction >= 0.15
    description: Wide bandgap required for tandem top cell (>1.7 eV)
\`\`\`
`,
};

export default page;
