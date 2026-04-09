import { DocPage } from "../index";

const page: DocPage = {
  slug: "configuration",
  title: "Configuration",
  description: "Configure MatCraft settings, environment variables, and project defaults.",
  category: "getting-started",
  order: 3,
  lastUpdated: "2026-04-01",
  tags: ["configuration", "settings", "environment"],
  readingTime: 6,
  body: `
## Configuration

MatCraft is configured through a layered system: global settings, project-level settings, environment variables, and CLI flags. Each layer overrides the one below it.

### Configuration Hierarchy

1. **CLI flags** (highest priority) -- \`materia run --budget 500\`
2. **Environment variables** -- \`MATERIA_BUDGET=500\`
3. **Project config** -- \`materia.toml\` in the project directory
4. **Global config** -- \`~/.config/materia/config.toml\`
5. **Defaults** (lowest priority) -- Built-in defaults

### Global Configuration

Create or edit \`~/.config/materia/config.toml\`:

\`\`\`toml
[general]
log_level = "info"          # debug, info, warning, error
output_format = "table"     # table, json, csv
color = true

[optimizer]
default_budget = 200
default_surrogate = "mlp"
default_method = "cma-es"
batch_size = 10
seed = 42

[api]
base_url = "https://api.matcraft.io"
api_key = "mc_live_..."

[dashboard]
port = 3000
auto_open = true
\`\`\`

### Project Configuration

Each project can override global settings with a \`materia.toml\` file in the project root:

\`\`\`toml
[project]
name = "water-membrane-study"
domain = "water"

[optimizer]
budget = 500
batch_size = 20
seed = 12345

[surrogate]
type = "mlp"
hidden_layers = [128, 64, 32]
learning_rate = 0.001
epochs = 200

[active_learning]
acquisition = "expected_improvement"
exploration_weight = 0.1

[export]
format = "csv"
include_all_evaluations = true
\`\`\`

### Environment Variables

All settings can be set via environment variables prefixed with \`MATERIA_\`:

| Variable | Description | Default |
|----------|-------------|---------|
| \`MATERIA_LOG_LEVEL\` | Logging verbosity | \`info\` |
| \`MATERIA_BUDGET\` | Evaluation budget | \`200\` |
| \`MATERIA_BATCH_SIZE\` | Candidates per iteration | \`10\` |
| \`MATERIA_SEED\` | Random seed for reproducibility | \`None\` |
| \`MATERIA_SURROGATE\` | Surrogate model type | \`mlp\` |
| \`MATERIA_API_KEY\` | API key for MatCraft cloud | \`None\` |
| \`MATERIA_OUTPUT_DIR\` | Directory for results output | \`./results\` |
| \`MATERIA_DEVICE\` | Compute device (\`cpu\`, \`cuda\`, \`mps\`) | \`cpu\` |

### Docker Environment

When running the full stack via Docker Compose, configure the \`.env\` file:

\`\`\`bash
# Database
DATABASE_URL=postgresql://matcraft:secret@db:5432/matcraft

# API
API_SECRET_KEY=change-me-in-production
API_CORS_ORIGINS=http://localhost:3000

# Worker
WORKER_CONCURRENCY=4
WORKER_MAX_MEMORY_MB=8192

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

### Reproducibility

For reproducible results, always set the random seed:

\`\`\`yaml
# In material.yaml
optimizer:
  method: cma-es
  budget: 200
  seed: 42
\`\`\`

Or via the CLI:

\`\`\`bash
materia run --seed 42
\`\`\`

Setting a seed ensures that initial sampling, surrogate training, and CMA-ES proposals are deterministic across runs.

### Logging

MatCraft uses structured logging. Set the log level to \`debug\` for detailed output during development:

\`\`\`bash
MATERIA_LOG_LEVEL=debug materia run
\`\`\`

Log output includes timestamps, iteration numbers, objective values, surrogate training loss, and acquisition function scores.

### See Also

- [CLI Config Command](/docs/cli-reference/config) for managing configuration from the command line
- [Architecture](/docs/getting-started/architecture) for an overview of how components interact
`,
};

export default page;
