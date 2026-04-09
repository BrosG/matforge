import { DocPage } from "../index";

const page: DocPage = {
  slug: "validation",
  title: "MDL Validation",
  description: "Validation rules, error messages, and how to debug MDL files.",
  category: "mdl",
  order: 6,
  lastUpdated: "2026-04-01",
  tags: ["mdl", "validation", "errors", "debugging"],
  readingTime: 6,
  body: `
## MDL Validation

MatCraft validates MDL files at two levels: **schema validation** (structure and types) and **semantic validation** (logical consistency and domain compatibility). Validation runs automatically before every campaign and can be invoked manually.

### Running Validation

\`\`\`bash
# Validate a specific file
materia validate material.yaml

# Validate with verbose output
materia validate material.yaml --verbose

# Validate and report all errors (not just the first)
materia validate material.yaml --all-errors
\`\`\`

### Programmatic Validation

\`\`\`python
from materia.mdl import parse_mdl, validate_mdl

spec = parse_mdl("material.yaml")
errors = validate_mdl(spec)

for error in errors:
    print(f"[{error.level}] {error.path}: {error.message}")
\`\`\`

### Schema Validation Rules

Schema validation checks that the YAML structure matches the expected format:

| Rule | Error Message |
|------|--------------|
| Missing \`name\` field | \`Required field 'name' is missing\` |
| Missing \`domain\` field | \`Required field 'domain' is missing\` |
| Empty \`parameters\` array | \`At least one parameter is required\` |
| Empty \`objectives\` array | \`At least one objective is required\` |
| Invalid parameter type | \`Parameter type must be 'continuous', 'integer', or 'categorical'\` |
| Missing bounds for continuous | \`Continuous parameter '{name}' requires 'bounds' field\` |
| Missing choices for categorical | \`Categorical parameter '{name}' requires 'choices' field\` |
| Invalid direction | \`Objective direction must be 'maximize' or 'minimize'\` |

### Semantic Validation Rules

Semantic validation checks logical consistency:

#### Parameter Rules

- **Bounds ordering**: Lower bound must be less than upper bound.
  \`\`\`
  Error: Parameter 'temperature' has inverted bounds [1200, 300].
  Fix: bounds: [300, 1200]
  \`\`\`

- **Unique names**: All parameter names must be distinct.
  \`\`\`
  Error: Duplicate parameter name 'concentration' at indices 2 and 5.
  \`\`\`

- **Finite bounds**: Bounds must be finite numbers (not NaN or infinity).

- **Integer bounds**: For integer parameters, bounds must be integers.
  \`\`\`
  Error: Integer parameter 'layers' has non-integer bound 3.5.
  \`\`\`

- **Categorical choices**: At least 2 unique choices are required.

#### Objective Rules

- **Unique names**: All objective names must be distinct.
- **Maximum count**: At most 5 objectives are allowed.
- **Positive weights**: If specified, weight must be greater than zero.

#### Constraint Rules

- **Valid references**: All variable names in expressions must match declared parameter names.
  \`\`\`
  Error: Constraint references unknown parameter 'temp'. Did you mean 'temperature'?
  \`\`\`

- **Parseable expression**: The expression must follow the supported grammar.
  \`\`\`
  Error: Cannot parse constraint expression '300 <= temp <= 1200'.
  Fix: Split into two constraints: 'temp >= 300' and 'temp <= 1200'
  \`\`\`

- **Satisfiable**: Constraints must not make the entire search space infeasible given the parameter bounds.

#### Domain Validation

- **Known domain**: The domain name must match a registered domain plugin.
- **Compatible parameters**: Some domains require specific parameter names or ranges. The domain plugin validates compatibility.

### Warning-Level Checks

Some checks produce warnings rather than errors:

- **Large search space**: More than 20 continuous parameters may lead to slow convergence.
- **Small budget**: Budget less than 10 times the number of parameters may be insufficient.
- **Wide bounds**: Parameter ranges spanning more than 4 orders of magnitude without \`log_scale: true\`.
- **No seed set**: Running without a seed makes results non-reproducible.

### Error Output Format

Validation errors include the path to the problematic field:

\`\`\`
[ERROR] parameters[2].bounds: Lower bound (100) must be less than upper bound (10)
[ERROR] constraints[0].expression: Unknown parameter 'temp' (did you mean 'temperature'?)
[WARN]  optimizer.budget: Budget of 30 may be insufficient for 15 parameters
\`\`\`

### Self-Check

The \`--self-check\` flag validates the MatCraft installation itself rather than an MDL file:

\`\`\`bash
materia validate --self-check
\`\`\`

This verifies that all core modules, optimizers, surrogate models, and domain plugins are properly installed and functional.

### Best Practices

1. **Validate early**: Run \`materia validate\` before starting expensive campaigns.
2. **Fix all warnings**: Warnings often indicate configuration issues that will lead to poor results.
3. **Use verbose mode**: \`--verbose\` shows additional context for each error.
4. **Check constraint satisfiability**: Ensure your constraints are not mutually exclusive with the parameter bounds.
`,
};

export default page;
