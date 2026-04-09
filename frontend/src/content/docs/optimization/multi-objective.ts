import { DocPage } from "../index";

const page: DocPage = {
  slug: "multi-objective",
  title: "Multi-Objective Optimization",
  description: "Theory and practice of optimizing multiple conflicting material properties simultaneously.",
  category: "optimization",
  order: 5,
  lastUpdated: "2026-04-01",
  tags: ["multi-objective", "pareto", "trade-offs", "theory"],
  readingTime: 7,
  body: `
## Multi-Objective Optimization

Most real-world materials optimization problems involve multiple conflicting objectives. Increasing a battery's energy density often reduces its cycle life. Making a membrane more permeable typically lowers its selectivity. Multi-objective optimization (MOO) finds the best possible trade-offs among these competing goals.

### Why Not Just Combine Objectives?

A common approach is to combine objectives into a single score using weights: \`score = w1 * obj1 + w2 * obj2\`. This has significant drawbacks:

- **Choosing weights is arbitrary**: The "right" weights depend on the application context, which may not be known during optimization.
- **Non-convex Pareto fronts**: Weighted sums can only find solutions on the convex hull of the Pareto front, missing potentially valuable solutions in concave regions.
- **Scale sensitivity**: Objectives with larger numerical values dominate unless carefully normalized.

MatCraft instead computes the full Pareto front, letting you choose trade-offs after seeing all options.

### Expected Hypervolume Improvement (EHVI)

For multi-objective acquisition, MatCraft uses Expected Hypervolume Improvement (EHVI). This is the multi-objective generalization of Expected Improvement:

\`\`\`
EHVI(x) = E[HV(P ∪ {f(x)}) - HV(P)]
\`\`\`

Where P is the current Pareto front and f(x) is the predicted objective vector for candidate x. EHVI naturally balances:

- **Convergence**: Candidates that extend the Pareto front outward (better objective values).
- **Diversity**: Candidates that fill gaps between existing Pareto solutions.

### Number of Objectives

MatCraft supports up to 5 simultaneous objectives, but performance and interpretability vary:

| Objectives | Pareto Front | Recommendation |
|-----------|--------------|----------------|
| 2 | A curve in 2D space | Ideal. Easy to visualize and interpret. |
| 3 | A surface in 3D space | Good. 3D interactive plots available. |
| 4 | A hypersurface | Challenging. Use parallel coordinates for visualization. |
| 5 | High-dimensional surface | Difficult. Consider reducing to essential objectives. |

### Defining Multiple Objectives

\`\`\`yaml
objectives:
  - name: energy_density
    direction: maximize
    unit: Wh/kg

  - name: cycle_life
    direction: maximize
    unit: cycles

  - name: cost
    direction: minimize
    unit: USD/kWh
\`\`\`

Objectives can mix maximize and minimize directions. Internally, MatCraft negates minimize objectives so that all optimization is performed as maximization.

### Objective Normalization

Before computing hypervolume or EHVI, objectives are normalized to [0, 1] based on the observed range. This ensures that objectives with different scales contribute equally:

\`\`\`
normalized_obj = (obj - obj_min) / (obj_max - obj_min)
\`\`\`

Normalization is updated at each iteration as new evaluations expand the observed range.

### Constraint Handling in MOO

Constraints interact with multi-objective optimization in two ways:

1. **Feasible-first ranking**: Feasible solutions always rank above infeasible ones, regardless of objective values.
2. **Constraint violation degree**: Among infeasible solutions, those with smaller total constraint violation are preferred.

This ensures that the optimizer first finds the feasible region, then optimizes within it.

### Decomposition Strategies

For problems with many objectives (4+), MatCraft can optionally decompose the multi-objective problem into multiple single-objective subproblems using reference direction methods:

\`\`\`yaml
optimizer:
  active_learning:
    decomposition: true
    n_reference_directions: 20
\`\`\`

Each reference direction defines a weighted scalarization. The overall Pareto front is assembled from all subproblem solutions.

### Practical Tips

1. **Start with 2 objectives**: Validate your setup with two objectives, then add more if needed.
2. **Check for redundancy**: If two objectives are strongly correlated (r > 0.9), one may be redundant. Use a scatter plot to check.
3. **Set reference points**: Explicit reference points make hypervolume comparisons consistent across campaigns.
4. **Use constraints instead of objectives**: If you have a hard requirement (e.g., strength > 100 MPa), express it as a constraint rather than an objective.

### Post-Optimization Decision Making

After obtaining the Pareto front, use one of these strategies to select a final design:

- **Knee-point selection**: Choose the solution with maximum curvature on the front.
- **Preference articulation**: Apply weights or thresholds based on application requirements.
- **Robust selection**: Among Pareto solutions, pick the one with smallest uncertainty (most reliable prediction).

See [Pareto Analysis](/docs/optimization/pareto-analysis) for implementation details.
`,
};

export default page;
