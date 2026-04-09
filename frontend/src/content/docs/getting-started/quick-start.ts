import { DocPage } from "../index";

const page: DocPage = {
  slug: "quick-start",
  title: "Quick Start Guide",
  description: "Create your first materials optimization campaign in 5 minutes.",
  category: "getting-started",
  order: 0,
  lastUpdated: "2026-04-01",
  tags: ["beginner", "tutorial", "quickstart"],
  readingTime: 5,
  body: `
## Your First Materials Discovery Campaign

MatCraft enables researchers and engineers to discover optimal material compositions using machine-learning-driven optimization. This guide walks you through creating and running your first campaign in under five minutes.

### Prerequisites

- Python 3.10 or later
- pip or conda package manager
- A terminal or command prompt

### Step 1: Install the MATERIA Engine

\`\`\`bash
pip install materia
\`\`\`

This installs the core library along with the CLI tools. To verify the installation, run:

\`\`\`bash
materia --version
\`\`\`

### Step 2: Initialize a New Project

Use the CLI to scaffold a new optimization project:

\`\`\`bash
materia init my-first-campaign --domain water
\`\`\`

This creates a directory called \`my-first-campaign\` containing a pre-configured MDL file (\`material.yaml\`) for water-membrane optimization. The \`--domain\` flag selects one of MatCraft's 16 built-in material domains.

### Step 3: Inspect the MDL File

Open \`my-first-campaign/material.yaml\` to see the generated Material Definition Language file:

\`\`\`yaml
name: water-membrane-v1
domain: water

parameters:
  - name: polymer_concentration
    type: continuous
    bounds: [0.05, 0.40]
  - name: crosslinker_ratio
    type: continuous
    bounds: [0.01, 0.15]
  - name: pore_size_nm
    type: continuous
    bounds: [1.0, 100.0]

objectives:
  - name: permeability
    direction: maximize
    unit: L/(m2*h*bar)
  - name: salt_rejection
    direction: maximize
    unit: "%"

optimizer:
  method: cma-es
  budget: 200
  surrogate: mlp
\`\`\`

This file defines the design space (parameters), the goals (objectives), and the optimization strategy. See the [MDL Specification](/docs/mdl/specification) for the full schema reference.

### Step 4: Run the Campaign

Launch the optimization loop:

\`\`\`bash
cd my-first-campaign
materia run
\`\`\`

MatCraft will begin an iterative optimization process:

1. **Initial sampling** -- Latin Hypercube Sampling generates the first batch of candidate materials.
2. **Evaluation** -- Each candidate is evaluated against the domain's physics model.
3. **Surrogate training** -- An MLP surrogate model is trained on evaluated results.
4. **Acquisition** -- CMA-ES proposes the next batch using Expected Improvement.
5. **Convergence check** -- The loop repeats until the budget is exhausted or convergence is detected.

You will see live progress in the terminal showing iteration number, best objective values, and hypervolume indicator.

### Step 5: View Results

Once the campaign finishes, inspect the Pareto-optimal solutions:

\`\`\`bash
materia results --pareto
\`\`\`

This prints a table of non-dominated solutions along with their parameter values and objective scores. For an interactive visualization, launch the dashboard:

\`\`\`bash
materia dashboard
\`\`\`

The dashboard opens a local web UI at \`http://localhost:3000\` showing convergence plots, Pareto fronts, and parameter importance analysis.

### Next Steps

- Read the [Installation Guide](/docs/getting-started/installation) for advanced setup options including GPU acceleration and Docker deployment.
- Explore [Core Concepts](/docs/getting-started/core-concepts) to understand the MATERIA engine architecture.
- Browse the [Domain Catalog](/docs/domains/overview) to see all 16 supported material classes.
- Learn to write custom MDL files in the [MDL Specification](/docs/mdl/specification).
`,
};

export default page;
