import { DocPage } from "../index";

const page: DocPage = {
  slug: "parameters",
  title: "Parameters",
  description: "Define design variables for your materials optimization problem.",
  category: "mdl",
  order: 1,
  lastUpdated: "2026-04-01",
  tags: ["mdl", "parameters", "design-space"],
  readingTime: 7,
  body: `
## Parameters

Parameters define the design space -- the set of variables the optimizer can adjust to find optimal material configurations. Each parameter has a name, type, and valid range or set of choices.

### Parameter Types

MatCraft supports three parameter types:

#### Continuous Parameters

Real-valued variables with lower and upper bounds. Suitable for physical quantities like concentrations, temperatures, and dimensions.

\`\`\`yaml
parameters:
  - name: temperature
    type: continuous
    bounds: [300.0, 1200.0]
    description: Sintering temperature in Kelvin
\`\`\`

The optimizer samples and proposes values anywhere within the bounds, including the endpoints. Internally, continuous parameters are normalized to [0, 1] for the surrogate model and CMA-ES.

#### Integer Parameters

Integer-valued variables with lower and upper bounds. Suitable for countable quantities like the number of layers, atomic counts, or processing cycles.

\`\`\`yaml
parameters:
  - name: num_layers
    type: integer
    bounds: [1, 10]
    description: Number of stacked thin-film layers
\`\`\`

Integer parameters are handled by rounding continuous proposals to the nearest integer during candidate generation.

#### Categorical Parameters

Variables that take one of a fixed set of discrete values. Suitable for material types, solvent choices, or crystal structures.

\`\`\`yaml
parameters:
  - name: crystal_system
    type: categorical
    choices: [cubic, tetragonal, hexagonal, orthorhombic]
    description: Target crystal system
\`\`\`

Categorical parameters are one-hot encoded internally. The optimizer treats each choice as a binary dimension and applies softmax-like selection during candidate generation.

### Parameter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| \`name\` | Yes | string | Unique identifier (alphanumeric + underscores) |
| \`type\` | Yes | string | \`continuous\`, \`integer\`, or \`categorical\` |
| \`bounds\` | For continuous/integer | [number, number] | [lower, upper] bounds |
| \`choices\` | For categorical | string[] | List of valid values |
| \`description\` | No | string | Human-readable description |
| \`unit\` | No | string | Physical unit (informational only) |
| \`log_scale\` | No | boolean | Sample in log space (default: false) |

### Log-Scale Parameters

For parameters spanning several orders of magnitude, use log-scale sampling:

\`\`\`yaml
parameters:
  - name: learning_rate
    type: continuous
    bounds: [0.0001, 0.1]
    log_scale: true
\`\`\`

When \`log_scale: true\`, the optimizer works in log-transformed space, ensuring uniform exploration across all orders of magnitude. This is particularly useful for concentrations, pressures, and diffusion coefficients that vary over wide ranges.

### Composition Parameters

A common pattern in materials science is composition optimization, where fractions must sum to a fixed value (usually 1.0). Define individual component fractions and add a constraint:

\`\`\`yaml
parameters:
  - name: component_a
    type: continuous
    bounds: [0.0, 1.0]
  - name: component_b
    type: continuous
    bounds: [0.0, 1.0]
  - name: component_c
    type: continuous
    bounds: [0.0, 1.0]

constraints:
  - expression: component_a + component_b + component_c <= 1.0
\`\`\`

The optimizer will respect this constraint and only propose valid compositions.

### Parameter Naming Conventions

Parameter names must:
- Start with a letter
- Contain only letters, numbers, and underscores
- Be unique within the MDL file
- Be between 1 and 64 characters

Recommended naming conventions:
- Use \`snake_case\`: \`polymer_concentration\`, not \`PolymerConcentration\`
- Include units in the description, not the name
- Use descriptive names that match domain terminology

### Programmatic Access

Parameters can be accessed from the parsed \`MaterialSpec\` object:

\`\`\`python
from materia.mdl import parse_mdl

spec = parse_mdl("material.yaml")
for param in spec.parameters:
    print(f"{param.name}: {param.type}, bounds={param.bounds}")
\`\`\`

### Dimension Limits

MatCraft supports up to 100 parameters per MDL file. CMA-ES is most effective for 5--50 dimensions. For higher-dimensional problems, consider using dimensionality reduction or hierarchical optimization.
`,
};

export default page;
