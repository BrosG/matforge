import { DocPage } from "../index";

const page: DocPage = {
  slug: "validate",
  title: "materia validate",
  description: "Validate MDL files and check installation health.",
  category: "cli-reference",
  order: 6,
  lastUpdated: "2026-04-01",
  tags: ["cli", "validate", "mdl", "check"],
  readingTime: 5,
  body: `
## materia validate

Validate an MDL file for schema correctness, semantic consistency, and domain compatibility. This command catches configuration errors before running an expensive optimization campaign.

### Synopsis

\`\`\`bash
materia validate [mdl-file] [options]
\`\`\`

### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| \`mdl-file\` | No | \`material.yaml\` | Path to the MDL file to validate |

### Options

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| \`--verbose\` | \`-v\` | boolean | false | Show detailed validation output |
| \`--all-errors\` | | boolean | false | Report all errors (not just the first) |
| \`--self-check\` | | boolean | false | Validate the installation instead of an MDL file |
| \`--strict\` | | boolean | false | Treat warnings as errors |

### Basic Usage

Validate the default MDL file:

\`\`\`bash
materia validate
\`\`\`

Validate a specific file:

\`\`\`bash
materia validate path/to/material.yaml
\`\`\`

### Successful Validation

\`\`\`bash
materia validate material.yaml
\`\`\`

Output:

\`\`\`
Validating material.yaml...
  Schema ............... PASS
  Parameters ........... PASS (5 parameters)
  Objectives ........... PASS (2 objectives)
  Constraints .......... PASS (1 constraint)
  Domain ............... PASS (water)
  Optimizer ............ PASS (cma-es, budget=300)
Validation complete: no errors found.
\`\`\`

### Validation Errors

\`\`\`bash
materia validate broken.yaml --all-errors
\`\`\`

Output:

\`\`\`
Validating broken.yaml...
  Schema ............... FAIL

Errors (3):
  [ERROR] parameters[2].bounds: Lower bound (100) must be less than upper bound (10)
  [ERROR] objectives[1].direction: Must be 'maximize' or 'minimize', got 'max'
  [ERROR] constraints[0].expression: Unknown parameter 'temp' (did you mean 'temperature'?)

Warnings (1):
  [WARN]  optimizer.budget: Budget of 30 may be insufficient for 5 parameters (recommend >= 50)

Validation failed: 3 errors, 1 warning.
\`\`\`

### Verbose Output

\`\`\`bash
materia validate material.yaml --verbose
\`\`\`

Verbose mode shows each validation check as it runs:

\`\`\`
Validating material.yaml...
  Parsing YAML .................. OK (0.01s)
  Checking required fields ...... OK
  Validating name format ........ OK ('water-membrane-v1')
  Checking domain ............... OK ('water' registered)

  Validating parameters:
    [1] polymer_concentration .... OK (continuous, [0.10, 0.35])
    [2] crosslinker_ratio ........ OK (continuous, [0.02, 0.12])
    [3] pore_size_nm ............. OK (continuous, [0.5, 50.0])
    Unique names check .......... OK
    Dimension count check ....... OK (3 parameters, < 100 limit)

  Validating objectives:
    [1] permeability ............. OK (maximize, L/(m2*h*bar))
    [2] salt_rejection ........... OK (maximize, %)
    Count check ................. OK (2 objectives, <= 5 limit)

  Validating constraints:
    [1] "membrane_thickness >= 20" OK (references valid parameter)

  Validating optimizer:
    Method ...................... OK (cma-es)
    Budget ...................... OK (300)
    Batch size .................. OK (15)
    Surrogate ................... OK (mlp)

  Domain-specific validation:
    Water domain checks ......... OK

Validation complete: no errors found.
\`\`\`

### Self-Check

Validate the MatCraft installation itself:

\`\`\`bash
materia validate --self-check
\`\`\`

Output:

\`\`\`
MatCraft Self-Check:
  Python version .......... 3.12.2 (OK)
  materia version ......... 1.4.0 (OK)
  Core engine ............. OK
  CMA-ES optimizer ........ OK
  MLP surrogate ........... OK
  Domain plugins .......... OK (16 domains loaded)
  CLI tools ............... OK
  numpy ................... 1.26.4 (OK)
  scipy ................... 1.12.0 (OK)
  torch ................... 2.2.1 (OK)
  GPU available ........... No (CPU mode)

Self-check passed. All components are functional.
\`\`\`

### Strict Mode

Treat warnings as errors. Useful in CI pipelines:

\`\`\`bash
materia validate material.yaml --strict
\`\`\`

If any warnings are present, the command exits with code 3 (validation error).

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Validation passed (no errors, no warnings in strict mode) |
| 3 | Validation failed (errors found, or warnings in strict mode) |

### CI Integration

Add validation to your CI pipeline:

\`\`\`yaml
# .github/workflows/validate.yml
- name: Validate MDL files
  run: |
    pip install materia
    materia validate material.yaml --strict --all-errors
\`\`\`

### See Also

- [MDL Validation](/docs/mdl/validation) for detailed validation rules
- [MDL Specification](/docs/mdl/specification) for the schema reference
- [Troubleshooting](/docs/getting-started/troubleshooting) for common errors
`,
};

export default page;
