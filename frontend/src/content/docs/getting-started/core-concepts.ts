import { DocPage } from "../index";

const page: DocPage = {
  slug: "core-concepts",
  title: "Core Concepts",
  description: "Understand the fundamental building blocks of MatCraft's optimization engine.",
  category: "getting-started",
  order: 2,
  lastUpdated: "2026-04-01",
  tags: ["concepts", "architecture", "fundamentals"],
  readingTime: 8,
  body: `
## Core Concepts

MatCraft is built around several key concepts that work together to enable automated materials discovery. Understanding these concepts will help you configure campaigns effectively and interpret results correctly.

### Campaigns

A **campaign** is a single optimization run. It takes an MDL file as input and produces a set of Pareto-optimal material candidates as output. Each campaign tracks its own history of evaluated candidates, surrogate model checkpoints, and convergence metrics.

\`\`\`bash
# Create and run a campaign
materia init my-campaign --domain water
materia run
\`\`\`

Campaigns transition through these states: \`created\` -> \`sampling\` -> \`running\` -> \`converged\` | \`completed\` | \`failed\`.

### Material Definition Language (MDL)

The **MDL** is a YAML-based format that fully describes an optimization problem. It specifies:

- **Parameters**: The design variables the optimizer can adjust (composition ratios, processing temperatures, structural dimensions, etc.)
- **Objectives**: The properties to optimize (strength, conductivity, permeability, etc.) with minimize/maximize directions.
- **Constraints**: Hard boundaries that candidate solutions must satisfy.
- **Optimizer settings**: Algorithm choice, evaluation budget, surrogate model configuration.

\`\`\`yaml
name: my-material
domain: battery

parameters:
  - name: cathode_ratio
    type: continuous
    bounds: [0.0, 1.0]

objectives:
  - name: energy_density
    direction: maximize
    unit: Wh/kg
\`\`\`

See the [MDL Specification](/docs/mdl/specification) for the complete schema.

### Parameters

Parameters define the search space. MatCraft supports three parameter types:

| Type | Description | Example |
|------|-------------|---------|
| **continuous** | Real-valued within bounds | Temperature: [300, 1200] K |
| **integer** | Integer-valued within bounds | Number of layers: [1, 10] |
| **categorical** | One of a set of discrete choices | Solvent: [water, ethanol, dmso] |

The optimizer explores combinations of these parameters to find configurations that best satisfy the objectives.

### Objectives

Objectives are the measurable properties you want to optimize. Each objective has a **direction** (minimize or maximize) and an optional **unit**. When multiple objectives are specified, MatCraft performs multi-objective optimization and returns the Pareto front -- the set of solutions where no objective can be improved without worsening another.

### Surrogate Models

Instead of evaluating every candidate with expensive physics simulations or real experiments, MatCraft builds **surrogate models** -- fast approximations trained on previously evaluated data. The default surrogate is a multi-layer perceptron (MLP), but MatCraft also supports GNN-based models like CHGNet and MACE for atomistic predictions.

The surrogate is retrained after each batch of evaluations, becoming progressively more accurate as data accumulates.

### Active Learning Loop

The core optimization cycle follows an **active learning** pattern:

1. **Sample** initial candidates using Latin Hypercube Sampling (LHS).
2. **Evaluate** candidates using the domain's physics model or experimental pipeline.
3. **Train** the surrogate model on all evaluated data.
4. **Acquire** new candidates by optimizing an acquisition function (Expected Improvement) over the surrogate using CMA-ES.
5. **Check convergence** using hypervolume improvement or budget exhaustion.
6. Repeat from step 2.

This cycle is far more sample-efficient than random search or grid search because the surrogate focuses evaluation on the most promising regions of the design space.

### Domains

A **domain** is a plugin that encapsulates the physics and evaluation logic for a specific material class. MatCraft ships with 16 built-in domains (water membranes, batteries, solar cells, catalysts, and more). Each domain provides:

- Default parameter ranges and objective definitions
- Physics-based or data-driven evaluation functions
- Domain-specific constraints and validation rules
- Template MDL files for common optimization scenarios

See the [Domains Overview](/docs/domains/overview) for the full catalog.

### Pareto Front

In multi-objective optimization, the **Pareto front** (or Pareto frontier) is the set of non-dominated solutions. A solution is non-dominated if no other solution is better in all objectives simultaneously. The Pareto front represents the optimal trade-off surface, and the user selects a final design based on application-specific preferences.

### Evaluation Budget

The **budget** controls how many candidate evaluations the optimizer is allowed to perform. A typical budget of 200 evaluations might be split into 20 initial LHS samples plus 18 active learning iterations of 10 candidates each. Larger budgets yield better-explored Pareto fronts but require more computation time.
`,
};

export default page;
