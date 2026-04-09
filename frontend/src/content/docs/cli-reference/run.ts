import { DocPage } from "../index";

const page: DocPage = {
  slug: "run",
  title: "materia run",
  description: "Execute a materials optimization campaign from the command line.",
  category: "cli-reference",
  order: 2,
  lastUpdated: "2026-04-01",
  tags: ["cli", "run", "optimization", "campaign"],
  readingTime: 6,
  body: `
## materia run

Execute a materials optimization campaign. This command starts the active learning loop: initial sampling, evaluation, surrogate training, and CMA-ES acquisition.

### Synopsis

\`\`\`bash
materia run [options]
\`\`\`

### Options

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| \`--mdl\` | \`-m\` | path | \`material.yaml\` | Path to the MDL file |
| \`--budget\` | \`-b\` | integer | (from MDL) | Override evaluation budget |
| \`--batch-size\` | | integer | (from MDL) | Override batch size |
| \`--seed\` | \`-s\` | integer | (from MDL) | Override random seed |
| \`--surrogate\` | | string | (from MDL) | Override surrogate model type |
| \`--device\` | | string | \`cpu\` | Compute device: \`cpu\`, \`cuda\`, \`mps\` |
| \`--output-dir\` | \`-o\` | path | \`./results\` | Directory for output files |
| \`--verbose\` | \`-v\` | boolean | false | Show detailed iteration logs |
| \`--quiet\` | \`-q\` | boolean | false | Suppress all non-error output |
| \`--resume\` | | boolean | false | Resume a previously interrupted campaign |
| \`--warmstart\` | | path | | CSV file with historical data for warm-starting |
| \`--dry-run\` | | boolean | false | Validate and show plan without executing |

### Basic Usage

Run with default settings from \`material.yaml\`:

\`\`\`bash
materia run
\`\`\`

Run with a specific MDL file:

\`\`\`bash
materia run --mdl path/to/my-material.yaml
\`\`\`

### Overriding Settings

CLI flags override settings in the MDL file and config:

\`\`\`bash
# Quick exploration run
materia run --budget 50 --batch-size 10 --seed 42

# Production run with GPU acceleration
materia run --budget 500 --device cuda --verbose
\`\`\`

### Verbose Output

With \`--verbose\`, each iteration displays detailed progress:

\`\`\`
Campaign: water-membrane-v1
Domain: water | Budget: 300 | Batch: 15 | Surrogate: mlp | Seed: 42
────────────────────────────────────────────────────────

[Iter  1/20] Phase: Initial sampling (LHS)
  Evaluating 15 candidates... done (2.3s)
  Best permeability: 12.4 L/(m2*h*bar)
  Best salt_rejection: 97.2%
  Hypervolume: 0.342
  Pareto size: 4

[Iter  2/20] Phase: Active learning
  Training MLP surrogate... done (0.8s, loss=0.0234)
  CMA-ES acquisition... done (1.2s, 15 candidates proposed)
  Evaluating 15 candidates... done (2.1s)
  Best permeability: 18.7 L/(m2*h*bar)
  Best salt_rejection: 98.1%
  Hypervolume: 0.487 (+0.145)
  Pareto size: 7

...

[Iter 15/20] Convergence detected (patience=5 exhausted)
Campaign completed: 225 evaluations, 18 Pareto solutions
Results saved to: ./results/water-membrane-v1/
\`\`\`

### Resuming a Campaign

If a campaign is interrupted (Ctrl+C, crash, etc.), resume from the last checkpoint:

\`\`\`bash
materia run --resume
\`\`\`

This loads the evaluation history from \`./results/\` and continues the active learning loop from where it stopped. The surrogate is retrained on all existing data.

### Warm-Starting

Pre-load historical experimental data to accelerate convergence:

\`\`\`bash
materia run --warmstart historical_data.csv
\`\`\`

The CSV must contain columns matching the parameter and objective names in the MDL file. The surrogate is trained on this data before the first acquisition step.

### Dry Run

Preview the campaign plan without executing:

\`\`\`bash
materia run --dry-run
\`\`\`

Output:

\`\`\`
Dry run: Campaign plan
  MDL file: material.yaml
  Domain: water
  Parameters: 5 (all continuous)
  Objectives: 2 (permeability, salt_rejection)
  Constraints: 1
  Optimizer: CMA-ES
  Budget: 300 evaluations
  Batch size: 15
  Estimated iterations: 20
  Surrogate: MLP [128, 64]
  Seed: 42
  Output: ./results/water-membrane-v1/
No execution performed.
\`\`\`

### Output Files

After completion, results are saved to the output directory:

\`\`\`
results/water-membrane-v1/
  campaign.json       # Campaign metadata and settings
  evaluations.json    # All evaluated candidates
  pareto.json         # Pareto-optimal solutions
  convergence.json    # Hypervolume history
  surrogate/          # Surrogate model checkpoints
  logs/               # Detailed run logs
\`\`\`

### Signal Handling

- **Ctrl+C (SIGINT)**: Gracefully stops after the current iteration and saves results.
- **Double Ctrl+C**: Forces immediate termination (results may be incomplete).

### See Also

- [Active Learning](/docs/optimization/active-learning) for algorithm details
- [Hyperparameters](/docs/optimization/hyperparameters) for tuning guidance
- [materia results](/docs/cli-reference/results) for viewing output
`,
};

export default page;
