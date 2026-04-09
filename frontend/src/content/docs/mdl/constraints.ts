import { DocPage } from "../index";

const page: DocPage = {
  slug: "constraints",
  title: "Constraints",
  description: "Define hard boundaries and feasibility conditions for candidate materials.",
  category: "mdl",
  order: 3,
  lastUpdated: "2026-04-01",
  tags: ["mdl", "constraints", "feasibility"],
  readingTime: 5,
  body: `
## Constraints

Constraints define hard feasibility conditions that candidate materials must satisfy. Unlike objectives (which are optimized), constraints act as binary filters -- a candidate either satisfies all constraints or is rejected.

### Basic Syntax

\`\`\`yaml
constraints:
  - expression: temperature >= 300
    description: Minimum processing temperature

  - expression: pressure <= 50.0
    description: Equipment pressure limit

  - expression: weight_a + weight_b + weight_c <= 1.0
    description: Composition fractions cannot exceed 100%
\`\`\`

### Constraint Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| \`expression\` | Yes | string | Inequality expression using parameter names |
| \`description\` | No | string | Human-readable explanation |
| \`tolerance\` | No | number | Numerical tolerance for equality (default: 1e-6) |

### Supported Operators

The constraint expression parser supports:

| Operator | Meaning | Example |
|----------|---------|---------|
| \`>=\` | Greater than or equal | \`thickness >= 20\` |
| \`<=\` | Less than or equal | \`cost <= 100\` |
| \`>\` | Strictly greater than | \`concentration > 0\` |
| \`<\` | Strictly less than | \`porosity < 1.0\` |
| \`==\` | Equal (with tolerance) | \`ratio == 0.5\` |
| \`+\` | Addition | \`a + b <= 1.0\` |
| \`-\` | Subtraction | \`max_temp - min_temp >= 50\` |
| \`*\` | Multiplication | \`length * width <= 500\` |
| \`/\` | Division | \`flow / area >= 10\` |

### Composition Constraints

The most common constraint type in materials science is a composition constraint. When optimizing component fractions, they must sum to a fixed value:

\`\`\`yaml
parameters:
  - name: ni_fraction
    type: continuous
    bounds: [0.0, 1.0]
  - name: mn_fraction
    type: continuous
    bounds: [0.0, 1.0]
  - name: co_fraction
    type: continuous
    bounds: [0.0, 1.0]

constraints:
  - expression: ni_fraction + mn_fraction + co_fraction <= 1.0
    description: Total transition metal fraction cannot exceed stoichiometry
\`\`\`

### Equipment and Process Constraints

Constraints can enforce physical or practical limits:

\`\`\`yaml
constraints:
  - expression: sintering_temp <= 1400
    description: Furnace maximum temperature is 1400 C

  - expression: film_thickness >= 5
    description: Deposition tool minimum thickness is 5 nm

  - expression: precursor_cost * batch_size <= 10000
    description: Maximum reagent budget per batch
\`\`\`

### How Constraints Are Enforced

MatCraft enforces constraints at two levels:

1. **Candidate generation**: During CMA-ES acquisition, proposed candidates are checked against constraints. Infeasible candidates are either repaired (projected back to the feasible region) or discarded and resampled.

2. **Post-evaluation filtering**: After evaluation, any candidate that violates constraints is excluded from the Pareto front and marked as infeasible in the results.

The repair mechanism uses a simple projection: for linear inequality constraints, infeasible points are projected onto the constraint boundary. For complex nonlinear constraints, rejection sampling is used instead.

### Constraint Violation Reporting

After a campaign, you can inspect constraint violations:

\`\`\`bash
materia results --show-violations
\`\`\`

This reports how many candidates were rejected and which constraints were most frequently violated, helping you assess whether the design space is overly constrained.

### Best Practices

- **Keep constraints simple**: Use linear inequalities when possible. Complex nonlinear constraints slow down candidate generation.
- **Avoid redundant constraints**: If a parameter has \`bounds: [10, 100]\`, you do not need a constraint \`param >= 10\`.
- **Use constraints for cross-parameter relationships**: Bounds handle single-parameter limits; constraints handle relationships between parameters.
- **Set reasonable tolerances**: For equality constraints, the default tolerance of 1e-6 works for most cases. Increase it if your evaluation function has limited numerical precision.

### Limitations

- Constraint expressions cannot reference objective values -- they can only reference parameters.
- The expression parser does not support functions like \`sin\`, \`exp\`, or \`log\`. For complex feasibility conditions, implement them in a custom domain plugin's \`is_feasible()\` method.
- Maximum of 20 constraints per MDL file.
`,
};

export default page;
