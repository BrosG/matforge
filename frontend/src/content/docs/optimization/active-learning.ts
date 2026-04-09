import { DocPage } from "../index";

const page: DocPage = {
  slug: "active-learning",
  title: "Active Learning",
  description: "The iterative sample-train-acquire loop that drives efficient materials discovery.",
  category: "optimization",
  order: 2,
  lastUpdated: "2026-04-01",
  tags: ["active-learning", "acquisition", "sample-efficiency"],
  readingTime: 7,
  body: `
## Active Learning

Active learning is the core optimization paradigm in MatCraft. Rather than evaluating materials randomly or on a grid, the active learning loop intelligently selects the most informative candidates to evaluate, dramatically reducing the number of expensive evaluations needed to find optimal solutions.

### The Active Learning Loop

\`\`\`
                 +------------------+
                 |  Initial Sample  |
                 |  (LHS, n=batch)  |
                 +--------+---------+
                          |
                          v
              +-----------+-----------+
              |  Evaluate Candidates  |<-------+
              |  (Domain Plugin)      |        |
              +-----------+-----------+        |
                          |                    |
                          v                    |
              +-----------+-----------+        |
              |  Train Surrogate      |        |
              |  (MLP on all data)    |        |
              +-----------+-----------+        |
                          |                    |
                          v                    |
              +-----------+-----------+        |
              |  Acquire Next Batch   |        |
              |  (CMA-ES + EI)        |--------+
              +-----------+-----------+
                          |
                     Converged?
                     Yes -> Stop
\`\`\`

### Phase 1: Initial Sampling

The loop begins with Latin Hypercube Sampling (LHS) to generate a diverse set of initial candidates. LHS ensures uniform coverage of the parameter space with far fewer samples than a grid:

- A 5-dimensional space with 10 levels per dimension would need 100,000 grid points.
- LHS generates the same coverage with just 10--20 samples.

The number of initial samples equals the \`batch_size\` by default but can be overridden:

\`\`\`yaml
optimizer:
  active_learning:
    initial_samples: 30
\`\`\`

### Phase 2: Evaluation

Each candidate is evaluated by the domain plugin's evaluation function. This is the expensive step -- it may involve physics simulations, DFT calculations, or even real experiments. The evaluation returns objective values for each candidate.

### Phase 3: Surrogate Training

After each batch of evaluations, the surrogate model is retrained from scratch on all available (parameters, objectives) data. Using all data (not just the latest batch) ensures the surrogate captures the full landscape learned so far.

### Phase 4: Acquisition

The acquisition function scores unevaluated candidates based on how likely they are to improve the current best solution. MatCraft uses CMA-ES to maximize the acquisition function over the surrogate model, proposing a batch of new candidates.

#### Expected Improvement (EI)

The default acquisition function is Expected Improvement:

\`\`\`
EI(x) = E[max(0, f(x) - f_best)]
\`\`\`

Where f(x) is the surrogate prediction and f_best is the current best objective value. EI balances:

- **Exploitation**: Candidates near known good regions (high predicted value).
- **Exploration**: Candidates in uncertain regions (high predicted variance).

The exploration-exploitation trade-off is controlled by the \`exploration_weight\` parameter:

\`\`\`yaml
optimizer:
  active_learning:
    acquisition: expected_improvement
    exploration_weight: 0.01
\`\`\`

Higher values of \`exploration_weight\` encourage more exploration of uncertain regions.

### Phase 5: Convergence Check

After each iteration, MatCraft checks whether the optimizer has converged:

1. **Hypervolume improvement**: If the hypervolume indicator improves by less than \`convergence_threshold\` for \`convergence_patience\` consecutive iterations, the campaign is considered converged.
2. **Budget exhaustion**: If the total number of evaluations reaches the budget, the campaign stops regardless of convergence.

\`\`\`yaml
optimizer:
  budget: 300
  active_learning:
    convergence_patience: 5
    convergence_threshold: 0.001
\`\`\`

### Batch vs. Sequential Acquisition

MatCraft acquires candidates in batches rather than one at a time. This enables parallel evaluation and is more practical for experimental workflows. Within each batch, candidates are selected using a diversity-aware strategy to avoid redundant proposals:

1. Select the top EI candidate.
2. For each subsequent slot in the batch, select the candidate with highest EI that is at least a minimum distance from already-selected candidates.

### Sample Efficiency

Active learning is typically 5--10x more sample-efficient than random search. For a water membrane optimization with 5 parameters:

| Strategy | Evaluations to find 90% of Pareto front |
|----------|----------------------------------------|
| Random search | ~1000 |
| Grid search | ~3000 |
| Active learning (MatCraft) | ~150 |

### Programmatic Access

\`\`\`python
from materia.active_learning.loop import ActiveLearningLoop

loop = ActiveLearningLoop(
    spec=material_spec,
    evaluator=domain_plugin,
    surrogate=mlp_surrogate,
    optimizer=cmaes_optimizer,
)

# Run the full loop
results = loop.run()

# Or step through manually
loop.initialize()
while not loop.converged:
    loop.step()
\`\`\`

### See Also

- [Convergence](/docs/optimization/convergence) for convergence detection details
- [CMA-ES](/docs/optimization/cma-es) for the optimizer used in the acquisition step
- [MLP Surrogate](/docs/optimization/mlp-surrogate) for the surrogate model
`,
};

export default page;
