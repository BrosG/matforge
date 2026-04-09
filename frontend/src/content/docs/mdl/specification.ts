import { DocPage } from "../index";

const page: DocPage = {
  slug: "specification",
  title: "MDL Specification",
  description: "Complete specification of the Material Definition Language schema.",
  category: "mdl",
  order: 0,
  lastUpdated: "2026-04-01",
  tags: ["mdl", "specification", "schema", "yaml"],
  readingTime: 8,
  body: `
## MDL Specification

The Material Definition Language (MDL) is a YAML-based schema that fully defines a materials optimization problem. Every campaign requires a valid MDL file, typically named \`material.yaml\`.

### Top-Level Structure

An MDL file has four required sections and several optional ones:

\`\`\`yaml
# Required
name: string              # Unique identifier for this material definition
domain: string            # Material domain (water, battery, solar, etc.)

parameters: []            # Design variables
objectives: []            # Properties to optimize

# Optional
description: string       # Human-readable description
version: string           # MDL schema version (default: "1.0")
constraints: []           # Hard constraints on parameters
optimizer: {}             # Optimizer configuration
metadata: {}              # Arbitrary key-value metadata
\`\`\`

### Complete Example

\`\`\`yaml
name: li-ion-cathode-v2
domain: battery
description: Optimize NMC cathode composition for energy density and cycle life
version: "1.0"

parameters:
  - name: nickel_fraction
    type: continuous
    bounds: [0.3, 0.9]
    description: Ni content in NMC

  - name: manganese_fraction
    type: continuous
    bounds: [0.05, 0.4]
    description: Mn content in NMC

  - name: cobalt_fraction
    type: continuous
    bounds: [0.05, 0.3]
    description: Co content in NMC

  - name: calcination_temp
    type: integer
    bounds: [700, 950]
    description: Calcination temperature in Celsius

  - name: electrolyte
    type: categorical
    choices: [EC-DMC, EC-DEC, EC-EMC]
    description: Electrolyte solvent system

objectives:
  - name: energy_density
    direction: maximize
    unit: Wh/kg

  - name: cycle_life
    direction: maximize
    unit: cycles

  - name: cost
    direction: minimize
    unit: USD/kWh

constraints:
  - expression: nickel_fraction + manganese_fraction + cobalt_fraction <= 1.0
    description: Composition fractions must sum to at most 1.0

optimizer:
  method: cma-es
  budget: 500
  batch_size: 20
  surrogate: mlp
  seed: 42

metadata:
  author: Dr. Chen
  project: ARPA-E Phase II
  lab: MIT DMSE
\`\`\`

### Field Reference

#### name (required)

A unique string identifier for this material definition. Used to name output files and track campaigns. Must match the pattern \`[a-zA-Z0-9_-]+\`.

#### domain (required)

The material domain plugin to use for evaluation. Must be one of the registered domains. Run \`materia init --list-domains\` to see available options.

#### parameters (required)

An array of parameter definitions. See [Parameters](/docs/mdl/parameters) for full details. Each parameter must have:
- \`name\`: Unique identifier within this file
- \`type\`: One of \`continuous\`, \`integer\`, or \`categorical\`
- \`bounds\` (for continuous/integer) or \`choices\` (for categorical)

#### objectives (required)

An array of objective definitions. See [Objectives](/docs/mdl/objectives) for full details. Each objective must have:
- \`name\`: Unique identifier
- \`direction\`: Either \`maximize\` or \`minimize\`

#### constraints (optional)

An array of constraint definitions. See [Constraints](/docs/mdl/constraints) for supported expression syntax.

#### optimizer (optional)

Optimizer configuration block. All fields have sensible defaults:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| \`method\` | string | \`cma-es\` | Optimization algorithm |
| \`budget\` | integer | \`200\` | Total evaluation budget |
| \`batch_size\` | integer | \`10\` | Candidates per iteration |
| \`surrogate\` | string | \`mlp\` | Surrogate model type |
| \`seed\` | integer | \`null\` | Random seed |

### Schema Versioning

The \`version\` field indicates the MDL schema version. The current version is \`"1.0"\`. Future versions will maintain backward compatibility within the same major version.

### Validation

Use the CLI to validate an MDL file:

\`\`\`bash
materia validate material.yaml
\`\`\`

Or validate programmatically:

\`\`\`python
from materia.mdl import parse_mdl, validate_mdl

spec = parse_mdl("material.yaml")
errors = validate_mdl(spec)
if errors:
    for e in errors:
        print(f"Error: {e}")
\`\`\`

See [MDL Validation](/docs/mdl/validation) for detailed validation rules.
`,
};

export default page;
