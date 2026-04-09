import { DocPage } from "../index";

const page: DocPage = {
  slug: "architecture",
  title: "Architecture",
  description: "Understand how MatCraft's components work together.",
  category: "getting-started",
  order: 5,
  lastUpdated: "2026-04-01",
  tags: ["architecture", "system-design", "components"],
  readingTime: 7,
  body: `
## Architecture Overview

MatCraft follows a layered architecture that separates the optimization engine from the user interface and orchestration layers. This design allows researchers to use the Python library directly, interact through the CLI, or leverage the full web platform.

### System Layers

\`\`\`
+----------------------------------------------+
|          Frontend (Next.js Dashboard)         |
+----------------------------------------------+
|          Backend API (FastAPI + WS)           |
+----------------------------------------------+
|              Python SDK / CLI                 |
+----------------------------------------------+
|            MATERIA Engine (Core)              |
|  +--------+  +---------+  +----------------+ |
|  | MDL    |  | Optimizer|  | Domain Plugins | |
|  | Parser |  | (CMA-ES)|  | (16 built-in)  | |
|  +--------+  +---------+  +----------------+ |
|  +-----------+  +----------+  +------------+ |
|  | Surrogate |  | Active   |  | Pareto     | |
|  | Models    |  | Learning |  | Analysis   | |
|  +-----------+  +----------+  +------------+ |
+----------------------------------------------+
\`\`\`

### MATERIA Engine

The core engine is a pure Python library with no web dependencies. It implements:

- **MDL Parser** (\`materia.mdl\`): Parses and validates YAML material definitions. Produces a strongly-typed \`MaterialSpec\` object that the rest of the engine consumes.

- **Optimizer** (\`materia.optimize\`): Implements CMA-ES (Covariance Matrix Adaptation Evolution Strategy) for proposing candidate solutions. The optimizer works in the surrogate's latent space when available.

- **Surrogate Models** (\`materia.surrogate\`): MLP, CHGNet, MACE, and ONNX surrogate models. The surrogate predicts objective values from parameter vectors, enabling fast candidate screening.

- **Active Learning** (\`materia.active_learning\`): Orchestrates the sample-evaluate-train-acquire loop. Manages the acquisition function (Expected Improvement) and convergence detection.

- **Pareto Analysis** (\`materia.analysis\`): Computes non-dominated fronts, hypervolume indicators, and crowding distances for multi-objective results.

- **Domain Plugins** (\`materia.plugins\`): Evaluation functions for specific material classes. Each plugin defines parameter schemas, physics models, and default configurations.

### Data Flow

A typical optimization campaign follows this data flow:

1. The user provides an MDL file (\`material.yaml\`).
2. The MDL parser validates it and produces a \`MaterialSpec\`.
3. The active learning loop starts:
   - **Sampling**: Latin Hypercube Sampling generates initial parameter vectors.
   - **Evaluation**: The domain plugin's \`evaluate()\` function scores each candidate.
   - **Training**: The surrogate model fits to all (parameters, objectives) pairs.
   - **Acquisition**: CMA-ES maximizes the acquisition function over the surrogate to propose new candidates.
   - **Convergence**: Hypervolume improvement is checked; if below threshold for N iterations, the loop terminates.
4. Results are written to disk as JSON and optionally exported to CSV.

### Backend API

The FastAPI backend provides:

- **REST endpoints** for campaign CRUD, job management, and results retrieval.
- **WebSocket** connections for real-time progress streaming during optimization.
- **Authentication** via API keys with role-based access control.
- **Job queue** for asynchronous campaign execution using background workers.

See the [API Reference](/docs/api-reference/overview) for endpoint documentation.

### Frontend Dashboard

The Next.js frontend provides:

- **Campaign management**: Create, monitor, and compare campaigns.
- **Interactive Pareto plots**: Zoomable scatter plots with candidate detail tooltips.
- **Convergence monitoring**: Real-time hypervolume and objective tracking.
- **Parameter exploration**: Parallel coordinates and distribution plots.

### CLI

The CLI (\`materia\`) is a thin wrapper around the MATERIA engine:

| Command | Purpose |
|---------|---------|
| \`materia init\` | Scaffold a new project with domain template |
| \`materia run\` | Execute the optimization campaign |
| \`materia results\` | Display results and Pareto front |
| \`materia dashboard\` | Launch local web dashboard |
| \`materia validate\` | Check MDL file correctness |
| \`materia export\` | Export results to CSV/JSON |
| \`materia config\` | View or modify settings |

### Plugin System

Domains are implemented as plugins using Python entry points. Third-party domains can be installed as packages and are automatically discovered:

\`\`\`python
# In setup.cfg or pyproject.toml
[project.entry-points."materia.domains"]
my_domain = "my_package.domain:MyDomainPlugin"
\`\`\`

See [Custom Plugin Development](/docs/domains/custom-plugin) for details.
`,
};

export default page;
