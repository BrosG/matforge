import { DocPage } from "../index";

const page: DocPage = {
  slug: "hyperparameters",
  title: "Hyperparameters",
  description: "Tuning guide for optimizer, surrogate, and active learning hyperparameters.",
  category: "optimization",
  order: 6,
  lastUpdated: "2026-04-01",
  tags: ["hyperparameters", "tuning", "configuration"],
  readingTime: 7,
  body: `
## Hyperparameters

MatCraft's optimization pipeline has three groups of hyperparameters: the CMA-ES optimizer, the MLP surrogate model, and the active learning loop. This guide explains each parameter and provides tuning recommendations.

### CMA-ES Hyperparameters

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| \`sigma0\` | 0.3 | 0.05--0.5 | Initial step size. Larger values explore more broadly at the start. |
| \`population_size\` | auto | 10--200 | Candidates per CMA-ES generation. Larger populations improve coverage but slow each generation. |

#### sigma0

The initial step size controls how far from the mean CMA-ES samples in its first generation. On normalized [0,1] parameter space:

- \`sigma0 = 0.5\`: Covers the entire space. Good for unknown landscapes.
- \`sigma0 = 0.3\`: Default. Balances exploration and exploitation.
- \`sigma0 = 0.1\`: Focuses near the initial mean. Good for refining a known good region.

\`\`\`yaml
optimizer:
  sigma0: 0.4  # More exploration
\`\`\`

#### population_size

CMA-ES internally manages a population of candidates. The default size follows the formula \`4 + floor(3 * ln(n))\` where n is the number of parameters. For 10 parameters, this is approximately 11.

Increase the population size for:
- High-dimensional problems (> 20 parameters)
- Highly multi-modal landscapes
- When the optimizer gets stuck in local optima

### Surrogate Hyperparameters

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| \`hidden_layers\` | [128, 64] | -- | Network architecture. More layers = more capacity. |
| \`learning_rate\` | 0.001 | 1e-4--0.01 | Adam optimizer learning rate. |
| \`epochs\` | 200 | 50--1000 | Maximum training epochs per iteration. |
| \`dropout\` | 0.1 | 0.0--0.5 | Regularization and uncertainty estimation. |
| \`activation\` | relu | relu, tanh, silu | Activation function. |

#### Sizing the Network

The surrogate should be sized relative to the data available:

| Evaluations | Recommended Architecture |
|-------------|-------------------------|
| < 50 | [32, 16] |
| 50--200 | [64, 32] |
| 200--500 | [128, 64] (default) |
| 500+ | [256, 128, 64] |

Overly large networks on small datasets will overfit, producing overconfident predictions that mislead the acquisition function.

#### Learning Rate

- **Too high** (> 0.01): Training loss oscillates; surrogate predictions are noisy.
- **Too low** (< 1e-4): Training is slow; may not converge within the epoch budget.
- **Default** (0.001): Works well for most problems.

If training loss plateaus early, try reducing the learning rate. If training loss is noisy, reduce it further.

#### Dropout

Dropout serves dual purposes in MatCraft:
1. **Regularization**: Prevents overfitting on small datasets.
2. **Uncertainty estimation**: MC Dropout at inference time provides prediction uncertainty for the acquisition function.

Higher dropout (0.2--0.3) is better for small datasets. Lower dropout (0.05--0.1) is better for large datasets. Setting dropout to 0.0 disables uncertainty estimation, which degrades acquisition function quality.

### Active Learning Hyperparameters

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| \`batch_size\` | 10 | 1--100 | Candidates per active learning iteration. |
| \`initial_samples\` | batch_size | 10--100 | LHS samples before first surrogate training. |
| \`acquisition\` | expected_improvement | -- | Acquisition function type. |
| \`exploration_weight\` | 0.01 | 0.001--0.1 | Exploration bonus in acquisition function. |
| \`convergence_patience\` | 5 | 2--20 | Iterations of stagnation before stopping. |
| \`convergence_threshold\` | 0.001 | 1e-4--0.01 | Minimum improvement to count as progress. |

#### batch_size

Larger batches:
- Enable parallel evaluation (important for experiments).
- Reduce the number of surrogate retraining cycles.
- May be less sample-efficient (more redundant evaluations per batch).

Smaller batches:
- Maximize sample efficiency (surrogate is retrained more frequently).
- Better for sequential evaluation pipelines.

A good rule of thumb: set batch_size to the number of evaluations you can run in parallel.

#### exploration_weight

Controls the exploration-exploitation balance in the acquisition function:

- \`0.001\`: Strongly exploitative. Best for smooth, low-noise landscapes.
- \`0.01\`: Default. Balanced.
- \`0.1\`: Strongly exploratory. Best for noisy or highly multi-modal landscapes.

### Recommended Configurations

#### Quick Screening Run

\`\`\`yaml
optimizer:
  budget: 100
  batch_size: 20
  sigma0: 0.5
  surrogate_config:
    hidden_layers: [32, 16]
    epochs: 100
\`\`\`

#### Production Campaign

\`\`\`yaml
optimizer:
  budget: 500
  batch_size: 15
  sigma0: 0.3
  seed: 42
  surrogate_config:
    hidden_layers: [128, 64]
    epochs: 300
  active_learning:
    convergence_patience: 8
    convergence_threshold: 0.0005
\`\`\`

#### High-Dimensional Search

\`\`\`yaml
optimizer:
  budget: 1000
  batch_size: 25
  sigma0: 0.4
  population_size: 100
  surrogate_config:
    hidden_layers: [256, 128, 64]
    epochs: 500
    dropout: 0.15
\`\`\`
`,
};

export default page;
