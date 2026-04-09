import { DocPage } from "../index";

const page: DocPage = {
  slug: "first-campaign",
  title: "Your First Campaign",
  description: "A step-by-step tutorial building a complete water-membrane optimization campaign.",
  category: "getting-started",
  order: 4,
  lastUpdated: "2026-04-01",
  tags: ["tutorial", "campaign", "water", "beginner"],
  readingTime: 10,
  body: `
## Your First Campaign: Water Membrane Optimization

This tutorial walks you through a complete optimization campaign for a reverse-osmosis water membrane. You will define design parameters, set up multi-objective optimization, run the campaign, and analyze Pareto-optimal results.

### Problem Setup

A reverse-osmosis membrane is characterized by a trade-off between **permeability** (how much water passes through) and **salt rejection** (how effectively it blocks dissolved salts). Improving one typically worsens the other. Our goal is to find the Pareto front of this trade-off.

### Step 1: Initialize the Project

\`\`\`bash
materia init membrane-study --domain water
cd membrane-study
\`\`\`

### Step 2: Customize the MDL File

Edit \`material.yaml\` to define your specific design space:

\`\`\`yaml
name: ro-membrane-v1
domain: water
description: Reverse osmosis membrane with permeability-rejection trade-off

parameters:
  - name: polymer_concentration
    type: continuous
    bounds: [0.10, 0.35]
    description: Weight fraction of polymer in casting solution

  - name: crosslinker_ratio
    type: continuous
    bounds: [0.02, 0.12]
    description: Molar ratio of crosslinker to polymer

  - name: pore_size_nm
    type: continuous
    bounds: [0.5, 50.0]
    description: Target pore diameter in nanometers

  - name: membrane_thickness_um
    type: continuous
    bounds: [10.0, 200.0]
    description: Active layer thickness in micrometers

  - name: annealing_temp_c
    type: continuous
    bounds: [60.0, 150.0]
    description: Post-fabrication annealing temperature

objectives:
  - name: permeability
    direction: maximize
    unit: L/(m2*h*bar)
    description: Pure water permeability

  - name: salt_rejection
    direction: maximize
    unit: "%"
    description: NaCl rejection rate at 15.5 bar

constraints:
  - expression: membrane_thickness_um >= 20.0
    description: Minimum thickness for mechanical integrity

optimizer:
  method: cma-es
  budget: 300
  batch_size: 15
  surrogate: mlp
  seed: 42
\`\`\`

### Step 3: Validate the Configuration

Before running, validate your MDL file for syntax and semantic correctness:

\`\`\`bash
materia validate material.yaml
\`\`\`

Expected output:

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

### Step 4: Run the Campaign

\`\`\`bash
materia run --verbose
\`\`\`

The optimizer will output progress for each iteration:

\`\`\`
[Iter  1/20] Evaluating 15 candidates (LHS initial sample)...
  Best permeability: 12.4 L/(m2*h*bar)
  Best salt_rejection: 97.2%
  Hypervolume: 0.342

[Iter  2/20] Training MLP surrogate (loss: 0.0234)...
[Iter  2/20] CMA-ES acquisition: 15 new candidates proposed
[Iter  2/20] Evaluating 15 candidates...
  Best permeability: 18.7 L/(m2*h*bar)
  Best salt_rejection: 98.1%
  Hypervolume: 0.487
  ...
\`\`\`

### Step 5: Monitor in Real Time

Open a second terminal and launch the live dashboard:

\`\`\`bash
materia dashboard
\`\`\`

The dashboard shows four panels:

1. **Convergence plot** -- Hypervolume indicator over iterations
2. **Pareto front** -- Scatter plot of permeability vs. salt rejection
3. **Parameter distributions** -- Histograms of sampled parameter values
4. **Surrogate accuracy** -- Predicted vs. actual values for each objective

### Step 6: Analyze Results

Once the campaign finishes:

\`\`\`bash
# View Pareto-optimal solutions
materia results --pareto

# Export full results to CSV
materia export --format csv --output results.csv

# Export only Pareto front
materia export --pareto --format csv --output pareto.csv
\`\`\`

Example Pareto output:

\`\`\`
Pareto-Optimal Solutions (12 candidates):
  #  polymer_conc  crosslinker  pore_nm  thickness  anneal_c  permeability  rejection
  1  0.142         0.034        12.3     45.2       95.0      42.1          91.3%
  2  0.185         0.058        8.7      62.1       110.5     31.4          95.8%
  3  0.231         0.078        4.2      98.3       125.0     18.9          98.7%
  ...
\`\`\`

### Step 7: Select a Design

The Pareto front presents the optimal trade-off between permeability and rejection. Select a design based on your application requirements:

- **Desalination**: Prioritize salt rejection above 98% (candidate #3)
- **Wastewater treatment**: Prioritize permeability above 35 L/(m2*h*bar) (candidate #1)
- **Balanced**: Choose a knee-point solution near candidate #2

### Next Steps

- Learn about [CMA-ES optimization](/docs/optimization/cma-es) for algorithm details
- Explore [Pareto Analysis](/docs/optimization/pareto-analysis) for advanced selection methods
- Try other domains like [batteries](/docs/domains/battery) or [solar cells](/docs/domains/solar)
`,
};

export default page;
