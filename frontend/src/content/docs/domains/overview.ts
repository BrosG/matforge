import { DocPage } from "../index";

const page: DocPage = {
  slug: "overview",
  title: "Domain Overview",
  description: "Catalog of all 16 built-in material domains and how domains work.",
  category: "domains",
  order: 0,
  lastUpdated: "2026-04-01",
  tags: ["domains", "catalog", "plugins"],
  readingTime: 7,
  body: `
## Domain Overview

Domains are plugins that encapsulate the evaluation logic, physics models, and default configurations for a specific class of materials. MatCraft ships with 16 built-in domains spanning energy, environmental, structural, and electronic materials.

### What a Domain Provides

Each domain plugin implements:

1. **Evaluation function**: Maps parameter vectors to objective values using physics models, empirical correlations, or pre-trained ML models.
2. **Default parameters**: Sensible parameter definitions and ranges for the material class.
3. **Default objectives**: Common optimization targets for the domain.
4. **Validation rules**: Domain-specific checks (e.g., composition constraints for alloys).
5. **Templates**: Pre-built MDL files for common optimization scenarios.

### Built-In Domains

| Domain | Slug | Parameters | Objectives | Description |
|--------|------|-----------|------------|-------------|
| Water Membranes | \`water\` | 5--8 | Permeability, rejection | RO, UF, FO membrane optimization |
| Lithium-Ion Batteries | \`battery\` | 5--10 | Capacity, cycle life, cost | Cathode, anode, electrolyte design |
| Solar Cells | \`solar\` | 5--8 | Efficiency, stability | Perovskite, organic PV, tandem cells |
| Catalysts | \`catalyst\` | 4--8 | Activity, selectivity | Heterogeneous and electrocatalysis |
| Hydrogen Storage | \`hydrogen\` | 4--7 | Capacity, kinetics | Metal hydrides, MOFs, chemical storage |
| Thermoelectrics | \`thermoelectric\` | 6--10 | ZT, power factor | Bi2Te3, PbTe, half-Heusler compounds |
| Polymers | \`polymer\` | 4--8 | Strength, toughness | Blends, composites, coatings |
| Ceramics | \`ceramic\` | 4--8 | Conductivity, toughness | Structural and functional ceramics |
| Superconductors | \`superconductor\` | 5--8 | Tc, Jc | High-Tc cuprates, iron-based |
| Steel Alloys | \`steel\` | 6--10 | Yield strength, ductility | AHSS, stainless, tool steels |
| Aluminum Alloys | \`aluminum\` | 5--8 | Strength, weight | Aerospace and automotive alloys |
| Glass | \`glass\` | 4--7 | Transparency, strength | Optical, structural, specialty glass |
| Concrete | \`concrete\` | 5--8 | Compressive strength, CO2 | Low-carbon concrete formulations |
| Adhesives | \`adhesive\` | 4--6 | Bond strength, cure time | Structural and pressure-sensitive |
| Biomaterials | \`biomaterial\` | 5--8 | Biocompatibility, strength | Implants, scaffolds, drug delivery |
| Coatings | \`coating\` | 5--8 | Hardness, adhesion | Thermal barrier, anti-corrosion |

### Using a Domain

Specify the domain in your MDL file:

\`\`\`yaml
domain: water
\`\`\`

Or when initializing a project:

\`\`\`bash
materia init my-project --domain battery
\`\`\`

### Listing Available Domains

\`\`\`bash
materia init --list-domains
\`\`\`

Output:

\`\`\`
Available domains (16):
  water          Water membrane optimization
  battery        Lithium-ion battery design
  solar          Solar cell efficiency
  catalyst       Heterogeneous catalysis
  hydrogen       Hydrogen storage materials
  thermoelectric Thermoelectric generators
  polymer        Polymer blends and composites
  ceramic        Structural and functional ceramics
  superconductor High-temperature superconductors
  steel          Steel alloy composition
  aluminum       Aluminum alloy optimization
  glass          Glass composition design
  concrete       Low-carbon concrete
  adhesive       Structural adhesives
  biomaterial    Biocompatible materials
  coating        Protective coatings
\`\`\`

### Domain Evaluation Models

Each domain uses one or more evaluation approaches:

- **Analytical models**: Closed-form equations derived from physics (e.g., Hagen-Poiseuille for membrane permeability).
- **Empirical correlations**: Data-driven regression models fitted to published experimental data.
- **Pre-trained ML models**: Neural networks trained on DFT databases or large experimental datasets.
- **Hybrid models**: Combinations of physics-based and data-driven components.

The evaluation function is transparent -- you can inspect the source code of any built-in domain in the \`materia.plugins\` package.

### Custom Domains

If none of the built-in domains matches your problem, you can create a custom domain plugin. See [Custom Plugin Development](/docs/domains/custom-plugin) for a step-by-step guide.

### Domain-Specific Documentation

Detailed documentation for each domain is available:

- [Water Membranes](/docs/domains/water)
- [Batteries](/docs/domains/battery)
- [Solar Cells](/docs/domains/solar)
- [Catalysts](/docs/domains/catalyst)
- [Hydrogen Storage](/docs/domains/hydrogen)
- [Thermoelectrics](/docs/domains/thermoelectric)
- [Polymers](/docs/domains/polymer)
- [Ceramics](/docs/domains/ceramic)
`,
};

export default page;
