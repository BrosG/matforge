import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "what-is-cma-es",
    question: "What is CMA-ES and why does MatCraft use it?",
    answer: `CMA-ES (Covariance Matrix Adaptation Evolution Strategy) is a derivative-free optimization algorithm that excels at solving non-convex, noisy, and multi-modal optimization problems. It is the default optimizer in MatCraft and is particularly well-suited for materials optimization.

## How CMA-ES Works

CMA-ES maintains a multivariate normal distribution over the search space and iteratively updates it to concentrate probability mass around promising regions:

1. **Sample**: Generate a population of candidate solutions from the current distribution.
2. **Evaluate**: Score each candidate using the surrogate model (or a physics evaluator).
3. **Select**: Rank candidates by fitness and select the top performers.
4. **Update**: Adapt the mean and covariance matrix of the distribution based on the selected candidates. The covariance matrix captures correlations between parameters, enabling the algorithm to learn the "shape" of the fitness landscape.

## Why CMA-ES for Materials

- **No gradients required**: Materials objectives are often non-differentiable (e.g., outputs from simulations or physical experiments). CMA-ES works purely from function evaluations.
- **Handles correlations**: Material components are frequently correlated (e.g., increasing one filler reduces the fraction available for another). The covariance matrix naturally captures these relationships.
- **Noise-tolerant**: Experimental measurements are inherently noisy. CMA-ES uses population-based sampling that smooths out noise.
- **Self-adapting step size**: The algorithm automatically adjusts its exploration radius -- searching broadly early on and narrowing as it converges.

## Configuration in MatCraft

\`\`\`yaml
optimizer:
  type: cma-es
  sigma0: 0.3          # Initial step size (fraction of parameter range)
  population_size: 20  # Candidates per generation (default: 4 + 3*ln(n))
  max_generations: 100 # Safety limit per iteration
\`\`\`

\`sigma0\` is the most important hyperparameter. A value of 0.3 means the initial search covers roughly 30% of each parameter's range. Start with 0.3 and decrease to 0.1 if you have a good prior on where the optimum lies.

## Comparison to Alternatives

CMA-ES outperforms random search, grid search, and simple genetic algorithms on problems with 3-50 parameters. For very high-dimensional problems (>100 parameters), consider the separable CMA-ES variant (\`type: sep-cma-es\`) which scales more efficiently.`,
    category: "optimization",
    order: 0,
    relatedSlugs: ["how-surrogate-models-work", "tuning-hyperparameters"],
    tags: ["cma-es", "optimizer", "algorithm"],
  },
  {
    slug: "how-surrogate-models-work",
    question: "How do surrogate models work in MatCraft?",
    answer: `Surrogate models are lightweight machine learning models that approximate expensive-to-evaluate functions. In MatCraft, they replace costly physics simulations or physical experiments during the optimization loop, enabling the optimizer to evaluate thousands of candidate compositions in seconds.

## The Role of Surrogates

In a typical materials optimization pipeline without surrogates, each evaluation might require:

- A DFT calculation (hours to days per composition)
- A molecular dynamics simulation (minutes to hours)
- A physical experiment (days to weeks)

A trained surrogate model can approximate these evaluations in **milliseconds**, enabling the CMA-ES optimizer to explore the design space efficiently.

## MLP Surrogate (Default)

MatCraft's default surrogate is a multi-layer perceptron (MLP) neural network:

\`\`\`python
from materia.surrogate import MLPSurrogate

surrogate = MLPSurrogate(
    hidden_layers=[64, 64],   # Two hidden layers with 64 neurons each
    activation="relu",         # ReLU activation function
    learning_rate=0.001,       # Adam optimizer learning rate
    epochs=200,                # Training epochs
    validation_split=0.2,      # 20% held out for validation
    early_stopping_patience=20 # Stop if validation loss plateaus
)
\`\`\`

The MLP takes component values as input and predicts objective values as output. For multi-objective problems, a separate output head is trained for each objective.

## Training Pipeline

1. **Normalization**: Input features are standardized to zero mean and unit variance. Objectives are min-max scaled.
2. **Training**: The MLP is trained using the Adam optimizer with mean squared error loss. Early stopping prevents overfitting on small datasets.
3. **Uncertainty estimation**: MatCraft uses MC Dropout or an ensemble of models to estimate prediction uncertainty. This uncertainty is critical for the active learning acquisition function.
4. **Retraining**: After each active learning iteration adds new data, the surrogate is retrained from scratch (not fine-tuned) to avoid catastrophic forgetting.

## When Surrogates Struggle

- **Very small datasets** (<10 points): The surrogate may not have enough data to learn meaningful patterns. Consider starting with a space-filling design (Latin Hypercube).
- **Highly discontinuous objectives**: MLPs assume some smoothness. If your objective has sharp phase transitions, increase network depth or consider a Gaussian Process surrogate.
- **Extrapolation**: Surrogates are less reliable outside the range of training data. MatCraft's acquisition function accounts for this by penalizing high-uncertainty regions.`,
    category: "optimization",
    order: 1,
    relatedSlugs: ["what-is-cma-es", "what-is-active-learning"],
    tags: ["surrogate", "mlp", "neural-network", "machine-learning"],
  },
  {
    slug: "what-is-active-learning",
    question: "What is active learning and how does MatCraft use it?",
    answer: `Active learning is a machine learning strategy where the model actively selects which data points to learn from next, rather than passively receiving a fixed dataset. In MatCraft, active learning drives the optimization loop by choosing the most informative compositions to evaluate, minimizing the total number of expensive experiments needed.

## The Active Learning Loop

MatCraft's active learning loop follows this cycle:

\`\`\`
Seed Data -> Train Surrogate -> Acquisition Function -> Select Candidates
    ^                                                        |
    |                                                        v
    +-------------- Evaluate & Add Data <------- Top-K Candidates
\`\`\`

1. **Train surrogate**: Fit the MLP on all available data.
2. **Generate candidates**: Use CMA-ES to optimize the acquisition function, producing a large set of promising candidates.
3. **Rank by acquisition**: Score each candidate using the acquisition function, which balances predicted performance (exploitation) with prediction uncertainty (exploration).
4. **Select top-K**: Choose the top \`batch_size\` candidates for evaluation.
5. **Evaluate**: Run the candidates through your physics model, simulation, or flag them for experimental validation.
6. **Add data**: Incorporate the new measurements and repeat.

## Acquisition Functions

MatCraft supports several acquisition functions:

- **Expected Improvement (EI)**: The default. Measures the expected amount by which a candidate improves over the current best. Good general-purpose choice.
- **Upper Confidence Bound (UCB)**: Adds a weighted uncertainty bonus to the predicted value. The \`exploration_weight\` parameter (kappa) controls the exploration-exploitation trade-off.
- **Probability of Improvement (PI)**: Measures the probability that a candidate beats the current best. More conservative than EI.
- **Thompson Sampling**: Samples from the surrogate's posterior distribution. Naturally balances exploration and exploitation.

\`\`\`yaml
acquisition:
  type: expected_improvement
  exploration_weight: 0.1  # Only used for UCB; ignored for EI
\`\`\`

## Why Active Learning Matters

Without active learning, you might need 500+ experiments to find a near-optimal composition in a 5D space. With active learning, MatCraft typically finds competitive solutions in 50-100 total evaluations (10-20 seed + 5-15 iterations of batch size 5). This represents a 5-10x reduction in experimental cost, which translates directly to saved time and money in a lab setting.

## Convergence

The loop terminates when the convergence criterion is met (e.g., no improvement for N consecutive iterations) or the maximum iteration count is reached.`,
    category: "optimization",
    order: 2,
    relatedSlugs: ["how-surrogate-models-work", "how-convergence-works"],
    tags: ["active-learning", "acquisition", "exploration"],
  },
  {
    slug: "what-is-pareto-front",
    question: "What is a Pareto front and how does MatCraft compute it?",
    answer: `A Pareto front (also called a Pareto frontier) is the set of solutions where no objective can be improved without worsening at least one other objective. It represents the optimal trade-off surface in multi-objective optimization.

## Intuitive Example

Consider optimizing a water membrane for two objectives:

- **Maximize water flux** (how fast water passes through)
- **Maximize salt rejection** (how effectively salt is blocked)

These objectives typically conflict: membranes with high flux tend to have lower rejection, and vice versa. The Pareto front is the curve of compositions where you cannot increase flux without decreasing rejection.

## How MatCraft Computes It

MatCraft uses a non-dominated sorting approach:

1. **Collect all evaluated candidates** across all iterations of the campaign.
2. **Non-dominated sorting**: A candidate A *dominates* candidate B if A is at least as good as B on all objectives and strictly better on at least one. Candidates that are not dominated by any other candidate form the Pareto front.
3. **Crowding distance**: Among Pareto-optimal solutions, MatCraft computes a crowding distance metric to ensure a well-distributed spread along the front.

\`\`\`python
from materia.analysis import compute_pareto_front

# Get the Pareto front from campaign results
front = compute_pareto_front(campaign.results)
print(f"Found {len(front)} Pareto-optimal solutions")

for candidate in front:
    print(f"  Flux: {candidate.water_flux:.1f}, Rejection: {candidate.salt_rejection:.1f}%")
\`\`\`

## Visualization

The MatCraft dashboard provides interactive Pareto plots:

- **2D Pareto plot**: For two objectives, the front is displayed as a curve with candidate points. Click any point to see the full composition.
- **3D Pareto plot**: For three objectives, an interactive 3D surface is rendered.
- **Parallel coordinates**: For four or more objectives, a parallel coordinates plot shows trade-offs across all objectives simultaneously.

## Using the Pareto Front

The Pareto front does not give you a single "best" answer -- it gives you the set of optimal trade-offs. Choosing among Pareto-optimal solutions is a domain decision:

- A water treatment plant might prioritize rejection over flux.
- A desalination startup might prioritize flux to reduce membrane area and cost.

MatCraft lets you apply preference weights or knee-point detection to highlight the most balanced solution on the front.`,
    category: "optimization",
    order: 3,
    relatedSlugs: ["multi-objective-optimization", "how-does-matcraft-work"],
    tags: ["pareto", "multi-objective", "trade-offs"],
  },
  {
    slug: "how-convergence-works",
    question: "How does MatCraft determine when optimization has converged?",
    answer: `Convergence detection is how MatCraft decides when to stop the optimization loop. Running too few iterations risks missing the optimum; running too many wastes computational and experimental resources.

## Convergence Criteria

MatCraft supports multiple convergence criteria, which can be combined:

### 1. Improvement Patience (Default)

The campaign stops if the best objective value has not improved by more than a threshold for a specified number of consecutive iterations:

\`\`\`yaml
convergence:
  patience: 5            # Stop after 5 iterations without improvement
  min_improvement: 0.01  # Minimum relative improvement to count as progress
\`\`\`

For multi-objective campaigns, "improvement" is measured by the hypervolume indicator of the Pareto front -- the volume of objective space dominated by the current front relative to a reference point.

### 2. Absolute Target

Stop when a target objective value is reached:

\`\`\`yaml
convergence:
  target:
    water_flux: 50.0        # Stop when flux >= 50
    salt_rejection: 95.0    # AND rejection >= 95%
\`\`\`

### 3. Maximum Iterations

A hard cap that always applies:

\`\`\`yaml
campaign:
  max_iterations: 30  # Never run more than 30 iterations
\`\`\`

### 4. Surrogate Stability

Stop when the surrogate model's predictions stabilize -- measured by the mean absolute change in predictions on a held-out validation set between consecutive iterations:

\`\`\`yaml
convergence:
  surrogate_stability: 0.005  # Stop when predictions change < 0.5%
\`\`\`

## Monitoring Convergence

The dashboard and CLI display a real-time convergence plot showing:

- **Best objective value** (or hypervolume) per iteration
- **Surrogate validation error** per iteration
- **Acquisition function maximum** per iteration (indicates how much the model thinks there is to gain)

A declining acquisition maximum is a strong signal that the search space has been well-explored.

## Recommendations

- For exploratory campaigns with cheap evaluations, set a high \`max_iterations\` (50+) and rely on patience-based stopping.
- For expensive experiments (physical lab work), set a conservative \`max_iterations\` (10-15) and manually review candidates at each iteration before approving evaluation.
- The default \`patience=5, min_improvement=0.01\` works well for most problems with 3-10 parameters.`,
    category: "optimization",
    order: 4,
    relatedSlugs: ["what-is-active-learning", "tuning-hyperparameters"],
    tags: ["convergence", "stopping", "iterations"],
  },
  {
    slug: "multi-objective-optimization",
    question: "How does multi-objective optimization work in MatCraft?",
    answer: `Multi-objective optimization (MOO) is the process of simultaneously optimizing two or more conflicting objectives. Most real-world materials problems are inherently multi-objective -- you want a material that is strong *and* lightweight, or conductive *and* cheap.

## MatCraft's Approach

MatCraft handles multi-objective optimization through a combination of surrogate models, scalarization, and Pareto analysis:

### 1. Per-Objective Surrogates

A separate surrogate model (or output head) is trained for each objective. This means the model independently predicts water flux, salt rejection, and cost for a given composition. Each surrogate has its own uncertainty estimate.

### 2. Scalarization for CMA-ES

CMA-ES natively optimizes a single scalar value. MatCraft converts multiple objectives into a scalar using one of these strategies:

- **Weighted sum**: \`score = w1 * obj1_normalized + w2 * obj2_normalized\`. Simple but can miss concave regions of the Pareto front.
- **Chebyshev scalarization** (default): Minimizes the worst-case weighted deviation from the ideal point. This can find solutions in concave regions and produces a more uniform Pareto front.
- **Random weight sampling**: On each iteration, random weight vectors are sampled. Over many iterations, this covers the full Pareto front.

\`\`\`yaml
objectives:
  - name: hardness
    direction: maximize
    weight: 0.6    # Optional; used for weighted scalarization
  - name: cost
    direction: minimize
    weight: 0.4
\`\`\`

### 3. Hypervolume-Based Acquisition

For the active learning loop, the acquisition function is extended to multi-objective settings using the **Expected Hypervolume Improvement (EHVI)**. This measures how much a new candidate would expand the dominated volume of the Pareto front, naturally balancing all objectives.

### 4. Pareto Front Construction

After the campaign completes (or at any intermediate point), MatCraft extracts the Pareto front from all evaluated candidates. The front is available as a DataFrame, a plot, or an interactive visualization.

\`\`\`python
results = campaign.run()

# Get Pareto-optimal candidates
pareto = results.pareto_front()
print(pareto[["hardness", "cost", "iron", "chromium", "nickel"]])

# Find the "knee" point -- the solution with the best balance
knee = results.pareto_knee()
print(f"Balanced solution: {knee}")
\`\`\`

## Number of Objectives

MatCraft supports 2-6 objectives efficiently. Beyond 6 objectives, the Pareto front becomes very large (most solutions are non-dominated in high dimensions), and the hypervolume computation becomes expensive. For many-objective problems (>6), consider grouping related objectives or using preference-based scalarization.`,
    category: "optimization",
    order: 5,
    relatedSlugs: ["what-is-pareto-front", "what-is-cma-es"],
    tags: ["multi-objective", "pareto", "scalarization"],
  },
  {
    slug: "custom-objective-functions",
    question: "Can I define custom objective functions?",
    answer: `Yes. MatCraft supports custom objective functions for cases where the built-in domain physics models do not cover your needs. You can define objectives as Python functions, external scripts, or API endpoints.

## Python Function Evaluator

The most common approach is to write a Python function that takes a composition dictionary and returns objective values:

\`\`\`python
from materia.evaluate import Evaluator
from materia import Campaign, Material

class MyEvaluator(Evaluator):
    """Custom evaluator for polymer blend properties."""

    def evaluate(self, composition: dict) -> dict:
        # Your custom logic here
        polymer_a = composition["polymer_a_fraction"]
        polymer_b = composition["polymer_b_fraction"]
        filler = composition["filler_loading"]

        # Could be an analytical model, a simulation call, or a lookup
        tensile_strength = self._run_simulation(polymer_a, polymer_b, filler)
        elongation = 150 - 200 * filler + 50 * polymer_b
        cost = 10 * polymer_a + 25 * polymer_b + 5 * filler

        return {
            "tensile_strength": tensile_strength,
            "elongation_at_break": elongation,
            "material_cost": cost,
        }

    def _run_simulation(self, a, b, f):
        # Call your simulation code, external binary, or API
        import subprocess
        result = subprocess.run(
            ["./my_sim", str(a), str(b), str(f)],
            capture_output=True, text=True
        )
        return float(result.stdout.strip())

material = Material.from_yaml("my_blend.yaml")
campaign = Campaign(
    material=material,
    evaluator=MyEvaluator(),
    max_iterations=15,
)
campaign.run()
\`\`\`

## Analytic Evaluator

For simple closed-form expressions, use the built-in analytic evaluator without writing a class:

\`\`\`yaml
evaluator:
  type: analytic
  expressions:
    tensile_strength: "120 * polymer_a + 80 * polymer_b + 200 * filler"
    cost: "10 * polymer_a + 25 * polymer_b + 5 * filler"
\`\`\`

## External API Evaluator

If your simulation runs as a web service:

\`\`\`yaml
evaluator:
  type: http
  url: "https://my-simulation-server.com/evaluate"
  method: POST
  headers:
    Authorization: "Bearer \${SIM_API_TOKEN}"
  timeout: 300  # seconds
\`\`\`

MatCraft will POST the composition as JSON and expect a JSON response with objective values.

## Human-in-the-Loop

For physical experiments, set the evaluator to \`manual\`. The campaign will pause at each iteration, display the proposed candidates on the dashboard, and wait for you to enter measured values before continuing:

\`\`\`yaml
evaluator:
  type: manual
\`\`\`

This is the recommended mode for lab-based optimization where each "evaluation" is a physical experiment.`,
    category: "optimization",
    order: 6,
    relatedSlugs: ["how-does-matcraft-work", "adding-physics-models"],
    tags: ["custom", "evaluator", "objectives", "simulation"],
  },
  {
    slug: "tuning-hyperparameters",
    question: "How do I tune hyperparameters for better optimization results?",
    answer: `MatCraft's defaults work well for most problems, but tuning key hyperparameters can improve convergence speed and solution quality. Here is a guide to the most impactful settings.

## Surrogate Model Hyperparameters

### Hidden Layers

\`\`\`yaml
surrogate:
  hidden_layers: [64, 64]  # Default
\`\`\`

- **Small datasets (<50 points)**: Use \`[32, 32]\` or even \`[32]\` to avoid overfitting.
- **Large datasets (>200 points)**: Scale up to \`[128, 128]\` or \`[128, 64, 32]\`.
- **High-dimensional inputs (>10 parameters)**: Add a wider first layer, e.g., \`[128, 64]\`.

### Learning Rate and Epochs

\`\`\`yaml
surrogate:
  learning_rate: 0.001  # Default. Decrease to 0.0005 for noisy data.
  epochs: 200           # Default. Increase to 500 for complex objectives.
  early_stopping_patience: 20  # Prevents overfitting
\`\`\`

### Ensemble Size

Using an ensemble of surrogates provides better uncertainty estimates for the acquisition function:

\`\`\`yaml
surrogate:
  ensemble_size: 5  # Train 5 independent MLPs (default: 1 with MC Dropout)
\`\`\`

Ensembles are more expensive to train but significantly improve active learning performance on small datasets.

## Optimizer Hyperparameters

### CMA-ES Settings

\`\`\`yaml
optimizer:
  sigma0: 0.3           # Start broad; decrease to 0.1 if you have a good prior
  population_size: 20   # Increase for noisy objectives or high dimensions
\`\`\`

- **sigma0**: The initial step size relative to parameter ranges. Use 0.3 for exploratory searches, 0.1 when you have a rough idea of the optimal region.
- **population_size**: Larger populations are more robust but slower. The default of \`4 + floor(3 * ln(n_params))\` is usually good. Double it for very noisy problems.

## Acquisition Function

\`\`\`yaml
acquisition:
  type: expected_improvement  # Best default
  # type: upper_confidence_bound
  # exploration_weight: 2.0   # Higher = more exploration
\`\`\`

- **EI** is the best default for most problems.
- **UCB** with a high \`exploration_weight\` (2.0-5.0) is useful when you suspect the design space has multiple local optima and want to explore more broadly.

## Batch Size

\`\`\`yaml
campaign:
  batch_size: 5  # Candidates per iteration
\`\`\`

- **Cheap evaluations** (simulations, analytic models): Use batch size 1 for maximum sample efficiency.
- **Expensive evaluations** (lab experiments): Use batch size 5-10 to maximize parallelism.
- Larger batches reduce the number of iterations but may explore less efficiently per evaluation.

## Quick Tuning Checklist

1. Start with defaults and run a baseline campaign.
2. Check the convergence plot. If the surrogate error is high, increase network size or ensemble count.
3. If convergence is slow, increase \`sigma0\` or switch to UCB with higher exploration weight.
4. If the surrogate overfits (training error low, validation error high), reduce network size or increase early stopping patience.`,
    category: "optimization",
    order: 7,
    relatedSlugs: ["what-is-cma-es", "how-surrogate-models-work", "how-convergence-works"],
    tags: ["hyperparameters", "tuning", "configuration"],
  },
];

export default faqs;
