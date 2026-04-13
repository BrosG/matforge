import { DocPage } from "../index";

const page: DocPage = {
  slug: "campaign-advanced",
  title: "Advanced Campaign Configuration",
  description: "Custom objectives, constraints, convergence criteria, and multi-objective strategies.",
  category: "tutorials",
  order: 9,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "campaign", "advanced", "optimization", "pareto"],
  readingTime: 7,
  body: `
## Advanced Campaign Configuration

This tutorial covers advanced optimization campaign features for users who want fine-grained control over the discovery process.

### Custom Objective Functions

Beyond the built-in domain objectives, you can define custom Python functions:

\`\`\`python
from materia import Campaign, Material, Objective

def thermal_stability_score(params):
    """Custom objective combining multiple factors."""
    temp = params["max_service_temp"]
    oxidation = params["oxidation_resistance"]
    creep = params["creep_strength"]
    return 0.4 * temp / 1500 + 0.3 * oxidation + 0.3 * creep

material = Material.from_yaml("my_material.yaml")
material.add_objective(Objective(
    name="thermal_score",
    function=thermal_stability_score,
    direction="maximize"
))
\`\`\`

### Complex Constraints

Define nonlinear constraints using Python expressions:

\`\`\`yaml
constraints:
  # Linear: component fractions sum to 1
  - expression: "x_A + x_B + x_C == 1.0"
    type: equality

  # Nonlinear: minimum solubility requirement
  - expression: "x_A * x_B > 0.01"
    type: inequality

  # Conditional: if using additive, concentration must exceed threshold
  - expression: "additive_conc >= 0.05 if additive_type != 'none'"
    type: conditional
\`\`\`

### Convergence Criteria

Control when the campaign stops:

\`\`\`yaml
optimizer:
  method: cma-es
  budget: 500
  convergence:
    # Stop if hypervolume improvement < threshold for N iterations
    hypervolume_patience: 10
    hypervolume_threshold: 0.001

    # Stop if best objective does not improve
    objective_patience: 15
    objective_threshold: 0.01

    # Minimum iterations before convergence check
    min_iterations: 20
\`\`\`

### Surrogate Model Selection

Choose different surrogate architectures based on your problem:

\`\`\`yaml
optimizer:
  surrogate: mlp          # Default: multi-layer perceptron
  # surrogate: gp          # Gaussian Process (better for < 100 points)
  # surrogate: rf          # Random Forest (robust, fast)
  # surrogate: ensemble    # Ensemble of all three (most accurate, slowest)

  surrogate_config:
    hidden_layers: [128, 64, 32]
    dropout: 0.1
    learning_rate: 0.001
    epochs: 200
\`\`\`

### Acquisition Functions

Control the exploration-exploitation balance:

\`\`\`yaml
optimizer:
  acquisition: ei          # Expected Improvement (default)
  # acquisition: ucb        # Upper Confidence Bound
  # acquisition: pi         # Probability of Improvement
  # acquisition: thompson   # Thompson Sampling

  acquisition_config:
    # For UCB: higher kappa = more exploration
    kappa: 2.0
    # For EI: xi adds exploration bonus
    xi: 0.01
\`\`\`

### Multi-Objective Strategies

For problems with 3+ objectives:

\`\`\`yaml
optimizer:
  multi_objective:
    method: nsga2          # NSGA-II for Pareto front
    # method: parego        # ParEGO (scalarization approach)
    # method: ehvi          # Expected Hypervolume Improvement

    # Reference point for hypervolume calculation
    reference_point: [0, 0, 100]

    # Pareto front size target
    pareto_size: 50
\`\`\`

### Warm-Starting from Previous Campaigns

Resume or build on prior results:

\`\`\`python
from materia import Campaign

# Load previous campaign data
campaign = Campaign.from_yaml("campaign.yaml")
campaign.load_data("previous_results.csv")

# The surrogate starts pre-trained on existing data
campaign.run()
\`\`\`

### Parallel Evaluation

For computationally expensive evaluations:

\`\`\`yaml
optimizer:
  batch_size: 20           # Evaluate 20 candidates in parallel
  n_workers: 4             # Use 4 parallel processes
  batch_strategy: cl       # Constant Liar for batch selection
\`\`\`

### Monitoring Callbacks

Add custom monitoring logic:

\`\`\`python
def on_iteration(campaign, iteration, results):
    best = results.best_objectives()
    print(f"Iter {iteration}: capacity={best['capacity']:.1f}, cost={best['cost']:.2f}")
    if best["capacity"] > 200:
        campaign.stop("Target capacity reached")

campaign.add_callback("on_iteration", on_iteration)
\`\`\`
`,
};

export default page;
