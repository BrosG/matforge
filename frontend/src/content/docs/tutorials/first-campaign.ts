import { DocPage } from "../index";

const page: DocPage = {
  slug: "first-campaign",
  title: "Running a Discovery Campaign",
  description: "Create and execute a multi-objective optimization campaign to discover optimal materials.",
  category: "tutorials",
  order: 2,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "campaign", "optimization", "discovery"],
  readingTime: 7,
  body: `
## Running a Discovery Campaign

This tutorial walks through creating and running a MatCraft optimization campaign to discover battery cathode materials that balance capacity, stability, and cost.

### Prerequisites

- MatCraft Python SDK installed (\`pip install matcraft\`)
- Basic familiarity with materials properties
- A terminal or Jupyter notebook

### Step 1: Define the Material Space

Create a YAML configuration file \`battery-campaign.yaml\`:

\`\`\`yaml
name: nmc-cathode-search
domain: battery

parameters:
  - name: ni_content
    type: continuous
    bounds: [0.50, 0.90]
  - name: mn_content
    type: continuous
    bounds: [0.05, 0.30]
  - name: co_content
    type: continuous
    bounds: [0.05, 0.25]
  - name: calcination_temp
    type: integer
    bounds: [750, 900]

objectives:
  - name: specific_capacity
    direction: maximize
    unit: mAh/g
  - name: capacity_retention
    direction: maximize
    unit: "%"
  - name: cobalt_cost
    direction: minimize
    unit: USD/kWh

constraints:
  - expression: ni_content + mn_content + co_content <= 1.0

optimizer:
  method: cma-es
  budget: 300
  batch_size: 15
  seed: 42
\`\`\`

### Step 2: Initialize the Campaign

\`\`\`bash
materia init my-battery-campaign --config battery-campaign.yaml
cd my-battery-campaign
\`\`\`

This creates a project directory with the configuration and sets up the database for storing results.

### Step 3: Run the Optimization

\`\`\`bash
materia run
\`\`\`

The optimizer begins iterating:

1. **Iteration 1-3**: Latin Hypercube Sampling explores the parameter space uniformly
2. **Iteration 4-10**: The MLP surrogate model starts guiding the search toward promising regions
3. **Iteration 10+**: Active learning focuses on Pareto-optimal trade-offs

Watch the terminal output for live updates on best objective values and hypervolume indicator.

### Step 4: Monitor Progress

In a separate terminal, launch the monitoring dashboard:

\`\`\`bash
materia dashboard
\`\`\`

The dashboard at \`http://localhost:3000\` shows:

- **Convergence plot**: Best objective values vs. iteration
- **Pareto front**: Current non-dominated solutions in objective space
- **Parameter distributions**: Histograms showing where the optimizer is sampling

### Step 5: Analyze Results

After the campaign completes (or you stop it early):

\`\`\`bash
materia results --pareto --format table
\`\`\`

This prints the Pareto-optimal solutions. You will typically see:

- **High-capacity solutions**: NMC811-like (Ni=0.8, Mn=0.1, Co=0.1) with 195+ mAh/g but lower retention
- **High-stability solutions**: NMC532-like with 160 mAh/g but >95% retention after 500 cycles
- **Low-cost solutions**: Cobalt-lean compositions with moderate capacity and stability

### Step 6: Export Results

\`\`\`bash
materia export --format csv --output results.csv
materia export --format jupyter --output analysis.ipynb
\`\`\`

The Jupyter notebook includes all data plus pre-built visualizations for publication.

### Next Steps

- [Advanced Campaign Configuration](/docs/tutorials/campaign-advanced) -- Custom objectives and convergence criteria
- [Pareto Analysis](/docs/optimization/pareto-analysis) -- Understanding multi-objective trade-offs
`,
};

export default page;
