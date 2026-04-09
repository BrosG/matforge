import { DocPage } from "../index";

const page: DocPage = {
  slug: "templates",
  title: "MDL Templates",
  description: "Pre-built MDL templates for common material optimization scenarios.",
  category: "mdl",
  order: 4,
  lastUpdated: "2026-04-01",
  tags: ["mdl", "templates", "examples"],
  readingTime: 7,
  body: `
## MDL Templates

MatCraft provides pre-built templates for common optimization scenarios across all 16 domains. Templates give you a working starting point with sensible parameter ranges, objectives, and optimizer settings that you can customize for your specific problem.

### Listing Available Templates

\`\`\`bash
# List all templates
materia init --list-templates

# List templates for a specific domain
materia init --list-templates --domain battery
\`\`\`

Example output:

\`\`\`
Available templates:

  water/
    ro-membrane         Reverse osmosis membrane optimization
    uf-membrane         Ultrafiltration membrane design
    forward-osmosis     Forward osmosis draw solution

  battery/
    nmc-cathode         NMC cathode composition optimization
    solid-electrolyte   Solid-state electrolyte screening
    anode-design        Silicon-graphite anode blending

  solar/
    perovskite          Perovskite absorber composition
    tandem-cell         Two-junction tandem solar cell
    organic-pv          Organic photovoltaic donor-acceptor

  catalyst/
    haber-bosch         Ammonia synthesis catalyst
    water-splitting     OER/HER catalyst design
    co2-reduction       CO2 electroreduction catalyst
\`\`\`

### Using a Template

\`\`\`bash
# Initialize with a specific template
materia init my-project --template battery/nmc-cathode
\`\`\`

This creates a project with a fully populated \`material.yaml\` based on the selected template.

### Template: Water / RO Membrane

\`\`\`yaml
name: ro-membrane
domain: water
description: Reverse osmosis membrane for desalination

parameters:
  - name: polymer_concentration
    type: continuous
    bounds: [0.10, 0.35]
    unit: wt%
  - name: crosslinker_ratio
    type: continuous
    bounds: [0.02, 0.12]
  - name: pore_size_nm
    type: continuous
    bounds: [0.5, 50.0]
    unit: nm
  - name: support_porosity
    type: continuous
    bounds: [0.3, 0.8]
  - name: tmpc_concentration
    type: continuous
    bounds: [0.05, 0.50]
    unit: wt%

objectives:
  - name: permeability
    direction: maximize
    unit: L/(m2*h*bar)
  - name: salt_rejection
    direction: maximize
    unit: "%"

optimizer:
  method: cma-es
  budget: 300
  batch_size: 15
\`\`\`

### Template: Battery / NMC Cathode

\`\`\`yaml
name: nmc-cathode
domain: battery
description: NMC cathode composition for Li-ion cells

parameters:
  - name: ni_content
    type: continuous
    bounds: [0.33, 0.90]
  - name: mn_content
    type: continuous
    bounds: [0.05, 0.34]
  - name: co_content
    type: continuous
    bounds: [0.05, 0.34]
  - name: calcination_temp
    type: integer
    bounds: [700, 950]
    unit: C
  - name: coating_thickness
    type: continuous
    bounds: [0.0, 5.0]
    unit: nm

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
\`\`\`

### Template: Solar / Perovskite

\`\`\`yaml
name: perovskite-absorber
domain: solar
description: Halide perovskite ABX3 composition

parameters:
  - name: ma_fraction
    type: continuous
    bounds: [0.0, 1.0]
    description: Methylammonium fraction in A-site
  - name: fa_fraction
    type: continuous
    bounds: [0.0, 1.0]
    description: Formamidinium fraction in A-site
  - name: cs_fraction
    type: continuous
    bounds: [0.0, 0.2]
    description: Cesium fraction in A-site
  - name: br_fraction
    type: continuous
    bounds: [0.0, 0.5]
    description: Bromide fraction in X-site
  - name: film_thickness
    type: continuous
    bounds: [200, 800]
    unit: nm

objectives:
  - name: pce
    direction: maximize
    unit: "%"
    description: Power conversion efficiency
  - name: stability_hours
    direction: maximize
    unit: hours
    description: T80 stability under illumination

constraints:
  - expression: ma_fraction + fa_fraction + cs_fraction <= 1.0

optimizer:
  method: cma-es
  budget: 350
  batch_size: 15
\`\`\`

### Customizing Templates

Templates are starting points. Common customizations include:

- **Narrowing parameter bounds** to focus on a region of interest
- **Adding parameters** for additional design variables
- **Changing the budget** based on available compute resources
- **Adding constraints** for lab or equipment limitations
- **Adjusting objectives** for your specific application requirements

### Creating Your Own Templates

If you frequently optimize a specific class of materials, save your MDL file as a reusable template:

\`\`\`bash
# Save current material.yaml as a template
materia config set-template my-lab/custom-membrane material.yaml
\`\`\`

Custom templates are stored in \`~/.config/materia/templates/\` and appear in \`--list-templates\` output.
`,
};

export default page;
