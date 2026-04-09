import { DocPage } from "../index";

const page: DocPage = {
  slug: "glossary",
  title: "Glossary",
  description: "Definitions of key terms used throughout the MatCraft documentation.",
  category: "getting-started",
  order: 6,
  lastUpdated: "2026-04-01",
  tags: ["glossary", "terminology", "reference"],
  readingTime: 6,
  body: `
## Glossary

A reference of key terms and concepts used throughout MatCraft documentation.

### A

**Acquisition Function**
A function that balances exploration and exploitation when selecting the next batch of candidates. MatCraft uses Expected Improvement (EI) by default, which estimates the probability and magnitude of improvement over the current best solution.

**Active Learning**
An iterative machine learning paradigm where the model selectively queries the most informative data points for labeling. In MatCraft, the active learning loop alternates between training a surrogate model and selecting new candidates to evaluate based on acquisition function scores.

### B

**Batch Size**
The number of candidate materials evaluated in each iteration of the active learning loop. Larger batch sizes enable parallel evaluation but may reduce sample efficiency. Default is 10.

**Budget**
The total number of candidate evaluations allowed in a campaign. This is the primary control for computational cost. A budget of 200 means 200 calls to the evaluation function.

### C

**Campaign**
A complete optimization run from start to finish. A campaign takes an MDL file as input and produces a Pareto front of optimal solutions as output.

**CMA-ES (Covariance Matrix Adaptation Evolution Strategy)**
The default optimizer in MatCraft. CMA-ES is a derivative-free evolutionary algorithm that adapts a multivariate normal distribution to the fitness landscape. It is particularly effective for non-convex, multi-modal optimization problems in 5--100 dimensions.

**Constraint**
A hard boundary condition that candidate solutions must satisfy. Constraints can be inequality expressions (\`thickness >= 20\`) or equality expressions. Candidates violating constraints are penalized or rejected.

**Convergence**
The state where the optimizer is no longer finding significantly better solutions. MatCraft detects convergence when the hypervolume improvement falls below a threshold for a specified number of consecutive iterations.

### D

**Domain**
A plugin that encapsulates the evaluation logic, default parameters, and physics models for a specific material class (e.g., water membranes, lithium-ion batteries). MatCraft ships with 16 built-in domains.

### E

**Evaluation Function**
The function that takes a parameter vector and returns objective values. This can be a physics simulation, a pre-trained model, or even a call to an external experimental system.

**Expected Improvement (EI)**
The default acquisition function. EI(x) = E[max(0, f(x) - f_best)] represents the expected amount by which a candidate x will improve over the current best-known solution.

### H

**Hypervolume Indicator**
A quality measure for multi-objective optimization. It calculates the volume of objective space dominated by the current Pareto front relative to a reference point. Larger hypervolume indicates a better-spread, higher-quality Pareto front.

### L

**Latin Hypercube Sampling (LHS)**
A statistical sampling method used for initial candidate generation. LHS ensures that the parameter space is uniformly covered with fewer samples than grid search, providing a diverse starting set for the surrogate model.

### M

**Material Definition Language (MDL)**
A YAML-based schema for defining materials optimization problems. MDL files specify parameters, objectives, constraints, and optimizer settings.

**MLP (Multi-Layer Perceptron)**
The default surrogate model in MatCraft. An MLP is a feedforward neural network that maps parameter vectors to predicted objective values. MatCraft's MLP uses ReLU activations and is retrained from scratch at each active learning iteration.

### N

**Non-Dominated Solution**
A solution where no other solution is strictly better in all objectives. The set of all non-dominated solutions forms the Pareto front.

### O

**Objective**
A measurable property to be optimized. Each objective has a direction (minimize or maximize) and optionally a unit. Multi-objective campaigns have two or more objectives.

### P

**Parameter**
A design variable that the optimizer can adjust. Parameters can be continuous (real-valued), integer, or categorical.

**Pareto Front**
The set of non-dominated solutions in multi-objective optimization. Every point on the Pareto front represents an optimal trade-off -- improving any one objective requires worsening at least one other.

**Plugin**
A Python package that extends MatCraft with a new material domain. Plugins register via entry points and implement the \`DomainPlugin\` interface.

### S

**Surrogate Model**
A fast approximation of the true evaluation function, trained on previously evaluated data. Surrogates enable the optimizer to screen thousands of candidates cheaply before selecting a batch for expensive evaluation.

### T

**Template**
A pre-configured MDL file for a common optimization scenario within a domain. Templates provide sensible defaults so users can start quickly.
`,
};

export default page;
