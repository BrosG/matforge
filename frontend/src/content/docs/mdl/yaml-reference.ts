import { DocPage } from "../index";

const page: DocPage = {
  slug: "yaml-reference",
  title: "YAML Reference",
  description: "Complete YAML schema reference for MDL files with all supported fields.",
  category: "mdl",
  order: 5,
  lastUpdated: "2026-04-01",
  tags: ["mdl", "yaml", "reference", "schema"],
  readingTime: 8,
  body: `
## YAML Reference

This page provides the complete YAML schema reference for MDL files. Every supported field is documented with its type, default value, and validation rules.

### Schema Overview

\`\`\`yaml
# material.yaml -- Full schema reference
name: string                    # Required. Pattern: [a-zA-Z0-9_-]{1,128}
domain: string                  # Required. Registered domain name
description: string             # Optional. Max 1024 characters
version: "1.0"                  # Optional. Schema version

parameters: Parameter[]         # Required. 1-100 parameters
objectives: Objective[]         # Required. 1-5 objectives
constraints: Constraint[]       # Optional. 0-20 constraints
optimizer: OptimizerConfig      # Optional. Defaults applied
metadata: Record<string, any>   # Optional. Free-form key-value pairs
\`\`\`

### Parameter Schema

\`\`\`yaml
parameters:
  - name: string                # Required. Unique, [a-zA-Z][a-zA-Z0-9_]{0,63}
    type: string                # Required. "continuous" | "integer" | "categorical"
    bounds: [number, number]    # Required for continuous/integer
    choices: string[]           # Required for categorical
    description: string         # Optional
    unit: string                # Optional
    log_scale: boolean          # Optional. Default: false. Only for continuous
\`\`\`

**Type-specific rules:**

| Type | Required fields | Constraints |
|------|----------------|-------------|
| \`continuous\` | \`bounds\` | bounds[0] < bounds[1], both finite |
| \`integer\` | \`bounds\` | bounds[0] < bounds[1], both integers |
| \`categorical\` | \`choices\` | 2-50 unique string values |

### Objective Schema

\`\`\`yaml
objectives:
  - name: string                # Required. Unique identifier
    direction: string           # Required. "maximize" | "minimize"
    unit: string                # Optional. Display unit
    description: string         # Optional
    reference_point: number     # Optional. For hypervolume computation
    weight: number              # Optional. Default: 1.0. Must be > 0
\`\`\`

### Constraint Schema

\`\`\`yaml
constraints:
  - expression: string          # Required. Inequality expression
    description: string         # Optional
    tolerance: number           # Optional. Default: 1e-6. For == constraints
\`\`\`

**Expression grammar:**

\`\`\`
expression := term operator term
term       := param_name | number | term arith_op term
operator   := ">=" | "<=" | ">" | "<" | "=="
arith_op   := "+" | "-" | "*" | "/"
param_name := [a-zA-Z][a-zA-Z0-9_]*
number     := float | integer
\`\`\`

### Optimizer Schema

\`\`\`yaml
optimizer:
  method: string                # Optional. Default: "cma-es"
  budget: integer               # Optional. Default: 200. Range: 10-10000
  batch_size: integer           # Optional. Default: 10. Range: 1-100
  surrogate: string             # Optional. Default: "mlp"
  seed: integer                 # Optional. Default: null (random)

  # Advanced CMA-ES settings
  sigma0: number                # Optional. Default: 0.3. Initial step size
  population_size: integer      # Optional. Default: auto (4 + 3*ln(n))

  # Advanced surrogate settings
  surrogate_config:
    hidden_layers: integer[]    # Default: [128, 64]
    learning_rate: number       # Default: 0.001
    epochs: integer             # Default: 200
    dropout: number             # Default: 0.1
    activation: string          # Default: "relu"

  # Active learning settings
  active_learning:
    acquisition: string         # Default: "expected_improvement"
    exploration_weight: number  # Default: 0.01
    convergence_patience: int   # Default: 5
    convergence_threshold: num  # Default: 0.001
    initial_samples: integer    # Default: same as batch_size
\`\`\`

### Metadata Schema

The metadata section accepts arbitrary key-value pairs. Values can be strings, numbers, booleans, or nested objects:

\`\`\`yaml
metadata:
  author: "Dr. Smith"
  institution: "MIT"
  project_id: "ARPA-E-2026"
  tags:
    - membrane
    - water
    - desalination
  experiment:
    lab: "Building 13, Room 405"
    equipment: "Spin coater Model X"
\`\`\`

Metadata is stored with results but does not affect optimization behavior.

### YAML Syntax Tips

**Multiline strings** for descriptions:

\`\`\`yaml
description: |
  This campaign optimizes a thin-film composite membrane
  for reverse osmosis desalination applications. The goal
  is to maximize water permeability while maintaining
  salt rejection above 97%.
\`\`\`

**Anchors and aliases** for repeated values:

\`\`\`yaml
_defaults: &composition_bounds
  type: continuous
  bounds: [0.0, 1.0]

parameters:
  - name: component_a
    <<: *composition_bounds
  - name: component_b
    <<: *composition_bounds
\`\`\`

**Comments** are supported with \`#\`:

\`\`\`yaml
parameters:
  - name: temperature
    type: continuous
    bounds: [300, 1200]  # Kelvin
\`\`\`

### File Encoding

MDL files must be UTF-8 encoded. The file extension should be \`.yaml\` or \`.yml\`. The default expected filename is \`material.yaml\`, but any path can be specified via \`materia run --mdl path/to/file.yaml\`.
`,
};

export default page;
