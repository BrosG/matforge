import { DocPage } from "../index";

const page: DocPage = {
  slug: "thermoelectric",
  title: "Thermoelectrics",
  description: "Optimize thermoelectric materials for waste heat recovery and cooling.",
  category: "domains",
  order: 6,
  lastUpdated: "2026-04-01",
  tags: ["thermoelectric", "ZT", "energy-harvesting"],
  readingTime: 6,
  body: `
## Thermoelectric Domain

The \`thermoelectric\` domain provides evaluation models for thermoelectric materials used in waste heat recovery and solid-state cooling. It covers bismuth telluride (Bi2Te3), lead telluride (PbTe), half-Heusler compounds, and skutterudites.

### Physics Model

The thermoelectric figure of merit ZT is calculated from three coupled transport properties:

\`\`\`
ZT = S^2 * sigma * T / kappa
\`\`\`

Where S is the Seebeck coefficient, sigma is the electrical conductivity, T is the absolute temperature, and kappa is the total thermal conductivity (lattice + electronic).

- **Seebeck coefficient** is modeled using the Mott formula with carrier concentration estimated from doping level and host band structure parameters.
- **Electrical conductivity** is calculated from carrier concentration, mobility (limited by alloy scattering and phonon scattering), and effective mass.
- **Thermal conductivity** combines the electronic contribution (Wiedemann-Franz law) with the lattice contribution (Callaway model with alloy and boundary scattering).

### Default Parameters

| Parameter | Type | Bounds | Unit | Description |
|-----------|------|--------|------|-------------|
| \`bi_fraction\` | continuous | [0.35, 0.45] | -- | Bi content |
| \`sb_substitution\` | continuous | [0.0, 0.10] | -- | Sb substitution on Bi site |
| \`se_substitution\` | continuous | [0.0, 0.10] | -- | Se substitution on Te site |
| \`dopant_concentration\` | continuous | [1e-3, 0.05] | -- | Carrier dopant level |
| \`hot_press_temp\` | integer | [350, 550] | C | Consolidation temperature |
| \`hot_press_pressure\` | continuous | [30, 80] | MPa | Consolidation pressure |
| \`ball_mill_time\` | continuous | [1, 48] | hours | Mechanical alloying time |

### Default Objectives

| Objective | Direction | Unit |
|-----------|-----------|------|
| \`zt\` | maximize | dimensionless |
| \`power_factor\` | maximize | uW/(cm*K2) |

### Key Trade-Offs

- **ZT vs. mechanical robustness**: Nanostructured materials with reduced lattice thermal conductivity achieve higher ZT but may be mechanically fragile.
- **Seebeck vs. conductivity**: Increasing carrier concentration raises electrical conductivity but reduces the Seebeck coefficient. The optimal carrier concentration is typically 10^19 to 10^20 per cm3.
- **Operating temperature**: Different materials excel at different temperatures. Bi2Te3 peaks near room temperature; PbTe peaks at 600-800 K.

### Example: Bi2Te3-Based Optimization

\`\`\`yaml
name: bte-thermoelectric
domain: thermoelectric

parameters:
  - name: sb_substitution
    type: continuous
    bounds: [0.0, 0.08]
  - name: se_substitution
    type: continuous
    bounds: [0.0, 0.06]
  - name: dopant_concentration
    type: continuous
    bounds: [0.001, 0.03]
    log_scale: true
  - name: hot_press_temp
    type: integer
    bounds: [380, 500]
  - name: ball_mill_time
    type: continuous
    bounds: [2, 24]

objectives:
  - name: zt
    direction: maximize
  - name: power_factor
    direction: maximize
    unit: uW/(cm*K2)

optimizer:
  method: cma-es
  budget: 400
  batch_size: 20
  seed: 42
\`\`\`

### Typical Results

Optimized Bi2Te3-based compositions typically achieve:

- **Peak ZT**: 1.2--1.8 at 300 K with optimized Sb/Se substitution and nanostructuring
- **Power factor**: 30--45 uW/(cm*K2) at optimal carrier concentration
- **Trade-off**: Highest ZT compositions may have lower power factor due to reduced electrical conductivity from alloy scattering

### Temperature-Dependent Optimization

The thermoelectric domain supports temperature-dependent evaluation. Specify the target operating temperature:

\`\`\`yaml
metadata:
  operating_temperature_k: 500
\`\`\`

This shifts the evaluation to model transport properties at the specified temperature, which is critical for matching the material to the application.
`,
};

export default page;
