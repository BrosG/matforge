import { DocPage } from "../index";

const page: DocPage = {
  slug: "pareto-analysis",
  title: "Pareto Analysis",
  description: "Analyze and interpret multi-objective Pareto fronts from optimization campaigns.",
  category: "optimization",
  order: 3,
  lastUpdated: "2026-04-01",
  tags: ["pareto", "multi-objective", "analysis", "trade-offs"],
  readingTime: 7,
  body: `
## Pareto Analysis

When optimizing multiple conflicting objectives, there is no single best solution. Instead, MatCraft returns the **Pareto front** -- the set of non-dominated solutions that represent optimal trade-offs. This page explains how to compute, visualize, and interpret Pareto fronts.

### Non-Domination

A solution A **dominates** solution B if A is at least as good as B in all objectives and strictly better in at least one. A solution is **non-dominated** (Pareto-optimal) if no other solution dominates it.

For example, with two maximization objectives:

| Candidate | Strength (MPa) | Toughness (J/m2) | Status |
|-----------|----------------|-------------------|--------|
| A | 500 | 120 | Pareto-optimal |
| B | 450 | 150 | Pareto-optimal |
| C | 400 | 110 | Dominated by A and B |
| D | 520 | 90 | Pareto-optimal |

Candidates A, B, and D form the Pareto front. Candidate C is dominated because B is better in both strength (450 > 400) and toughness (150 > 110).

### Hypervolume Indicator

The hypervolume indicator measures the quality of a Pareto front by computing the volume of objective space that is dominated by the front, relative to a reference point. A larger hypervolume indicates a better Pareto front in terms of both convergence (closeness to the true optimum) and diversity (spread across the front).

MatCraft computes the hypervolume at each iteration and uses its improvement rate for convergence detection.

### Viewing the Pareto Front

\`\`\`bash
# Print Pareto-optimal solutions
materia results --pareto

# Show all solutions with domination status
materia results --all --show-dominated

# Export Pareto front to CSV
materia export --pareto --format csv
\`\`\`

### Programmatic Analysis

\`\`\`python
from materia.analysis.pareto import compute_pareto_front, hypervolume

# Compute Pareto front from objective arrays
# objectives: np.ndarray of shape (n_candidates, n_objectives)
# directions: list of "maximize" or "minimize"
pareto_mask = compute_pareto_front(objectives, directions)
pareto_solutions = objectives[pareto_mask]

# Compute hypervolume
ref_point = [0.0, 0.0]  # Must be dominated by all Pareto points
hv = hypervolume(pareto_solutions, ref_point, directions)
print(f"Hypervolume: {hv:.4f}")
\`\`\`

### Selecting a Solution from the Pareto Front

The Pareto front presents options, but ultimately you need to pick one design. Common selection strategies:

#### 1. Knee-Point Selection

The **knee point** is the solution on the Pareto front with maximum curvature -- the point where a small sacrifice in one objective yields the largest gain in another. It is often considered the "best compromise" solution.

\`\`\`python
from materia.analysis.pareto import find_knee_point

knee = find_knee_point(pareto_solutions, directions)
print(f"Knee-point solution: {knee}")
\`\`\`

#### 2. Weighted Preference

Assign weights to objectives based on application requirements, then select the solution that minimizes the weighted distance to the ideal point:

\`\`\`python
from materia.analysis.pareto import weighted_selection

# Prefer strength 3x more than toughness
selected = weighted_selection(
    pareto_solutions,
    weights=[3.0, 1.0],
    directions=["maximize", "maximize"],
)
\`\`\`

#### 3. Constraint-Based Filtering

Filter the Pareto front to only solutions meeting minimum requirements, then select among the remaining:

\`\`\`python
# Only consider solutions with salt rejection >= 97%
filtered = pareto_solutions[pareto_solutions[:, 1] >= 97.0]
# Among those, pick the one with highest permeability
best = filtered[filtered[:, 0].argmax()]
\`\`\`

### Crowding Distance

Crowding distance measures how isolated a Pareto solution is from its neighbors on the front. Solutions with high crowding distance are in sparse regions and contribute more to the diversity of the front. MatCraft reports crowding distance alongside Pareto solutions:

\`\`\`bash
materia results --pareto --show-crowding
\`\`\`

### Visualization

The MatCraft dashboard provides interactive Pareto plots:

- **2D Pareto scatter**: For two-objective problems, a scatter plot with the Pareto front highlighted.
- **3D Pareto surface**: For three-objective problems, a 3D surface rendering.
- **Parallel coordinates**: For 4+ objectives, parallel coordinate plots show all trade-offs simultaneously.

\`\`\`bash
materia dashboard
\`\`\`

### Comparing Campaigns

To compare Pareto fronts from different campaigns (e.g., different optimizer settings or material formulations):

\`\`\`bash
materia results --compare campaign_a/ campaign_b/ --metric hypervolume
\`\`\`

This reports the hypervolume for each campaign and overlays their Pareto fronts on a single plot.

### See Also

- [Multi-Objective Optimization](/docs/optimization/multi-objective) for background theory
- [Convergence](/docs/optimization/convergence) for how hypervolume drives stopping criteria
`,
};

export default page;
