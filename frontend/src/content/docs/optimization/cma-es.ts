import { DocPage } from "../index";

const page: DocPage = {
  slug: "cma-es",
  title: "CMA-ES Optimizer",
  description: "How MatCraft uses Covariance Matrix Adaptation Evolution Strategy for materials optimization.",
  category: "optimization",
  order: 0,
  lastUpdated: "2026-04-01",
  tags: ["cma-es", "optimizer", "evolution-strategy"],
  readingTime: 8,
  body: `
## CMA-ES Optimizer

CMA-ES (Covariance Matrix Adaptation Evolution Strategy) is the default optimization algorithm in MatCraft. It is a derivative-free, stochastic optimization method particularly well-suited for non-convex, multi-modal fitness landscapes common in materials science.

### Why CMA-ES?

Materials optimization problems have several properties that make CMA-ES an excellent choice:

- **No gradient required**: Evaluation functions are often black-box physics simulations or experimental measurements with no analytical gradient.
- **Non-convex landscapes**: Material property surfaces frequently have multiple local optima.
- **Moderate dimensionality**: Most material design spaces have 5--50 parameters, which is the sweet spot for CMA-ES.
- **Noisy evaluations**: CMA-ES is robust to evaluation noise from simulations or experiments.

### Algorithm Overview

CMA-ES maintains a multivariate normal distribution over the parameter space and iteratively adapts it:

1. **Sample** a population of candidate solutions from the current distribution N(m, sigma^2 * C), where m is the mean, sigma is the step size, and C is the covariance matrix.
2. **Evaluate** each candidate using the surrogate model (or directly via the evaluation function).
3. **Rank** candidates by fitness (objective value or acquisition function score).
4. **Update** the distribution parameters:
   - The mean m moves toward the best candidates.
   - The covariance matrix C adapts to the local fitness landscape shape.
   - The step size sigma adjusts based on the evolution path.
5. Repeat until budget is exhausted or convergence is detected.

### Integration with Surrogate Models

In MatCraft, CMA-ES does not directly evaluate the expensive physics model. Instead, it optimizes the **acquisition function** over the **surrogate model**:

\`\`\`
CMA-ES proposes candidates
    -> Acquisition function (EI) scores candidates using surrogate predictions
    -> Best candidates are selected for expensive evaluation
    -> Surrogate is retrained with new data
    -> CMA-ES restarts with updated surrogate
\`\`\`

This two-level approach is far more sample-efficient than running CMA-ES directly on the evaluation function.

### Configuration

CMA-ES parameters are set in the \`optimizer\` section of the MDL file:

\`\`\`yaml
optimizer:
  method: cma-es
  budget: 300
  batch_size: 15
  sigma0: 0.3
  population_size: 50
\`\`\`

| Parameter | Default | Description |
|-----------|---------|-------------|
| \`sigma0\` | 0.3 | Initial step size (relative to normalized bounds). Larger values encourage exploration; smaller values focus near initial solutions. |
| \`population_size\` | auto | Population size per CMA-ES generation. Default is 4 + floor(3 * ln(n)) where n is the number of parameters. |

### Handling Different Parameter Types

CMA-ES operates natively on continuous variables. MatCraft handles the other types transparently:

- **Continuous parameters**: Normalized to [0, 1] and sampled directly.
- **Integer parameters**: Sampled as continuous, then rounded to the nearest integer.
- **Categorical parameters**: One-hot encoded. CMA-ES samples in the continuous relaxation, and the highest-scoring category is selected via argmax.

### Multi-Objective Extension

For multi-objective optimization, MatCraft uses CMA-ES to optimize the acquisition function, which itself accounts for multi-objective trade-offs via Expected Hypervolume Improvement (EHVI). The CMA-ES population is scored by EHVI rather than a single fitness value.

### Restart Strategy

CMA-ES can converge prematurely to a local optimum. MatCraft implements an automatic restart strategy:

- When the step size sigma drops below a threshold (1e-8), CMA-ES restarts with an increased initial sigma.
- Each restart doubles the population size (IPOP-CMA-ES strategy).
- The restart preserves all previously evaluated data for surrogate training.

### Performance Characteristics

| Design Space Size | Expected Performance |
|------------------|---------------------|
| 2--5 parameters | Excellent. Converges in 50--100 evaluations. |
| 5--20 parameters | Very good. Converges in 100--300 evaluations. |
| 20--50 parameters | Good. May require 300--1000 evaluations. |
| 50--100 parameters | Moderate. Consider dimensionality reduction. |
| 100+ parameters | Not recommended. Use alternative methods. |

### Programmatic Access

\`\`\`python
from materia.optimize.cmaes import CMAESOptimizer

optimizer = CMAESOptimizer(
    dim=5,
    sigma0=0.3,
    population_size=20,
    seed=42,
)

# Propose candidates
candidates = optimizer.ask(n=10)

# Report fitness values
optimizer.tell(candidates, fitness_values)
\`\`\`

### See Also

- [Hyperparameters](/docs/optimization/hyperparameters) for tuning CMA-ES settings
- [MLP Surrogate](/docs/optimization/mlp-surrogate) for the default surrogate model
- [Active Learning](/docs/optimization/active-learning) for the overall optimization loop
`,
};

export default page;
