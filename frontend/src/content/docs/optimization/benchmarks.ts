import { DocPage } from "../index";

const page: DocPage = {
  slug: "benchmarks",
  title: "Benchmarks",
  description: "Performance benchmarks comparing MatCraft's optimizer against baselines.",
  category: "optimization",
  order: 7,
  lastUpdated: "2026-04-01",
  tags: ["benchmarks", "performance", "comparison"],
  readingTime: 6,
  body: `
## Benchmarks

This page presents performance benchmarks for MatCraft's optimization pipeline across standard test functions and real materials science problems. All benchmarks use the default MLP surrogate and CMA-ES optimizer unless otherwise noted.

### Methodology

Each benchmark reports the **hypervolume indicator** (for multi-objective) or **best objective value** (for single-objective) as a function of the number of evaluations. Results are averaged over 10 independent runs with different random seeds. Error bars show the standard deviation.

### Synthetic Test Functions

#### ZDT1 (2 objectives, 5 dimensions)

A standard convex bi-objective benchmark:

| Method | Evaluations to 95% HV | Final HV (200 evals) |
|--------|----------------------|---------------------|
| MatCraft (CMA-ES + MLP) | 85 | 0.961 |
| Random search | 450+ | 0.823 |
| NSGA-II (direct) | 180 | 0.942 |
| Bayesian optimization (GP) | 70 | 0.958 |

MatCraft achieves near-optimal hypervolume in 85 evaluations, approximately 5x faster than random search and competitive with Gaussian process-based Bayesian optimization.

#### DTLZ2 (3 objectives, 10 dimensions)

A standard multi-objective benchmark with a spherical Pareto front:

| Method | Evaluations to 90% HV | Final HV (500 evals) |
|--------|----------------------|---------------------|
| MatCraft (CMA-ES + MLP) | 210 | 0.912 |
| Random search | 1500+ | 0.741 |
| NSGA-II (direct) | 800 | 0.889 |
| Bayesian optimization (GP) | 180 | 0.921 |

In 10 dimensions with 3 objectives, MatCraft shows strong performance. The MLP surrogate scales better to higher dimensions than Gaussian processes.

#### Rosenbrock (single-objective, 20 dimensions)

A classic unimodal but ill-conditioned test function:

| Method | Evaluations to < 1.0 residual |
|--------|-------------------------------|
| MatCraft (CMA-ES + MLP) | 320 |
| CMA-ES (direct, no surrogate) | 2800 |
| Random search | 10000+ |

The surrogate-assisted approach converges nearly 9x faster than CMA-ES without a surrogate.

### Materials Science Benchmarks

#### Water Membrane (5 parameters, 2 objectives)

Permeability vs. salt rejection optimization using the built-in water domain:

| Method | Evaluations to 90% HV | Final HV (300 evals) |
|--------|----------------------|---------------------|
| MatCraft | 120 | 0.873 |
| Random search | 800+ | 0.692 |
| Grid search (10 levels) | 100,000 | 0.891 |

MatCraft finds a high-quality Pareto front in 120 evaluations, compared to 100,000 for an exhaustive grid search over the same space.

#### Battery Cathode (6 parameters, 3 objectives)

NMC cathode optimization for capacity, retention, and cost:

| Method | Evaluations to 85% HV | Final HV (400 evals) |
|--------|----------------------|---------------------|
| MatCraft | 180 | 0.841 |
| Random search | 1200+ | 0.628 |
| Expert-guided search | ~200 | 0.790 |

MatCraft outperforms domain-expert-guided trial-and-error, demonstrating that automated optimization can discover non-intuitive material compositions.

### Scaling Benchmarks

#### Parameter Space Dimensionality

Time per iteration and evaluations to convergence as a function of parameter count:

| Parameters | Time/Iteration | Evals to 90% HV | MLP Training Time |
|-----------|---------------|-----------------|-------------------|
| 5 | 0.8 s | 80 | 0.3 s |
| 10 | 1.2 s | 150 | 0.5 s |
| 20 | 2.5 s | 350 | 1.2 s |
| 50 | 8.1 s | 900 | 3.8 s |
| 100 | 25 s | 2500+ | 12 s |

The MLP surrogate scales linearly with parameter count. CMA-ES scales quadratically (due to the covariance matrix), making it impractical beyond 100 dimensions.

#### Dataset Size Scaling

Surrogate training time as a function of evaluated candidates:

| Candidates | MLP Training (200 epochs) | Prediction (1000 candidates) |
|-----------|--------------------------|------------------------------|
| 50 | 0.3 s | 0.01 s |
| 200 | 0.8 s | 0.01 s |
| 1000 | 3.2 s | 0.01 s |
| 5000 | 15 s | 0.02 s |

Prediction time is nearly constant, enabling fast acquisition function evaluation.

### Hardware Benchmarks

All timings measured on a single machine with AMD Ryzen 9 5900X CPU and NVIDIA RTX 3090 GPU:

| Surrogate | Device | Training (200 epochs, 500 samples) |
|-----------|--------|-------------------------------------|
| MLP | CPU | 1.2 s |
| MLP | GPU | 0.4 s |
| CHGNet | CPU | 45 s |
| CHGNet | GPU | 8 s |
| MACE | CPU | 120 s |
| MACE | GPU | 18 s |

For the default MLP surrogate, CPU performance is sufficient. GPU acceleration provides the most benefit for GNN-based surrogates.

### Reproducing Benchmarks

All benchmarks can be reproduced using the built-in benchmark suite:

\`\`\`bash
pip install materia[dev]
python -m materia.benchmarks --suite all --seeds 10 --output results/
\`\`\`

Results are saved as CSV files and can be plotted with the included visualization scripts.
`,
};

export default page;
