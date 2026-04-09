import { DocPage } from "../index";

const page: DocPage = {
  slug: "convergence",
  title: "Convergence",
  description: "How MatCraft detects convergence and when to stop optimization campaigns.",
  category: "optimization",
  order: 4,
  lastUpdated: "2026-04-01",
  tags: ["convergence", "stopping-criteria", "hypervolume"],
  readingTime: 6,
  body: `
## Convergence

Convergence detection determines when an optimization campaign has found sufficiently good solutions and further evaluations are unlikely to yield meaningful improvement. MatCraft uses multiple convergence criteria to decide when to stop the active learning loop.

### Convergence Criteria

MatCraft checks three stopping conditions after each iteration:

#### 1. Budget Exhaustion

The simplest criterion: stop when the total number of evaluations reaches the configured budget.

\`\`\`yaml
optimizer:
  budget: 300  # Stop after 300 evaluations
\`\`\`

This is a hard limit that is always enforced regardless of other convergence criteria.

#### 2. Hypervolume Stagnation

The primary convergence metric for multi-objective optimization. If the hypervolume indicator improves by less than a threshold for several consecutive iterations, the optimizer has stagnated:

\`\`\`yaml
optimizer:
  active_learning:
    convergence_threshold: 0.001    # Minimum relative improvement
    convergence_patience: 5         # Consecutive stagnant iterations
\`\`\`

The relative improvement is calculated as:

\`\`\`
improvement = (HV_current - HV_previous) / HV_previous
\`\`\`

If \`improvement < convergence_threshold\` for \`convergence_patience\` consecutive iterations, the campaign is marked as converged.

#### 3. Objective Stagnation (Single-Objective)

For single-objective campaigns, convergence is detected when the best objective value has not improved by more than the threshold for the specified number of iterations.

### Interpreting Convergence Plots

The convergence plot in the MatCraft dashboard shows:

- **X-axis**: Iteration number (or total evaluations)
- **Y-axis**: Hypervolume indicator (or best objective for single-objective)
- **Convergence band**: Shaded region showing the threshold -- once the curve enters and stays in this band, convergence is near.

A healthy convergence curve shows:

1. **Rapid early improvement**: Large jumps in hypervolume during the first few iterations as the surrogate learns the landscape.
2. **Diminishing returns**: Smaller improvements as the Pareto front fills in.
3. **Plateau**: Near-zero improvement indicating convergence.

### Adjusting Convergence Settings

#### More Exploration (Longer Runs)

If you suspect the optimizer is stopping too early:

\`\`\`yaml
optimizer:
  active_learning:
    convergence_threshold: 0.0001  # Require smaller improvement
    convergence_patience: 10       # Wait longer before stopping
\`\`\`

#### Faster Convergence (Shorter Runs)

If computation time is limited:

\`\`\`yaml
optimizer:
  active_learning:
    convergence_threshold: 0.01   # Accept larger stagnation
    convergence_patience: 3       # Stop sooner
\`\`\`

### Convergence Diagnostics

After a campaign, inspect convergence metrics:

\`\`\`bash
# Show convergence summary
materia results --convergence

# Output includes:
#   Total iterations: 15
#   Total evaluations: 225
#   Final hypervolume: 0.847
#   Converged: Yes (iteration 15, patience exhausted)
#   Hypervolume history: [0.12, 0.34, 0.51, 0.63, 0.71, ...]
\`\`\`

### Programmatic Access

\`\`\`python
from materia.active_learning.convergence import ConvergenceChecker

checker = ConvergenceChecker(
    threshold=0.001,
    patience=5,
)

# After each iteration
checker.update(hypervolume=0.847)
if checker.converged:
    print(f"Converged at iteration {checker.iteration}")
\`\`\`

### Early Stopping vs. Convergence

**Early stopping** refers to the surrogate model training stopping before reaching max epochs (to prevent overfitting). **Convergence** refers to the outer active learning loop stopping because the Pareto front has stabilized. These are independent mechanisms:

- The surrogate can early-stop training at every iteration while the campaign continues.
- The campaign converges when the Pareto front stops improving, regardless of how the surrogate trains.

### Best Practices

1. **Start with default settings** (\`threshold=0.001\`, \`patience=5\`). These work well for most problems.
2. **Use the budget as a safety net**: Set the budget to 2--3x the expected convergence point. The optimizer will stop early if it converges but won't run forever if it does not.
3. **Monitor convergence plots**: If the hypervolume is still climbing steeply when the campaign ends, increase the budget.
4. **Compare with random baselines**: If the convergence curve barely outperforms random search, the surrogate may be inaccurate. Check the surrogate diagnostics.
`,
};

export default page;
