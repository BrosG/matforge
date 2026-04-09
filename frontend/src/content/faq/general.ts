import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "what-is-matcraft",
    question: "What is MatCraft?",
    answer: `MatCraft is an AI-powered materials discovery and optimization platform designed to accelerate the development of advanced materials. It provides a unified workflow for defining material compositions, running surrogate-model-driven optimization, and exploring multi-objective trade-offs -- all without requiring deep expertise in machine learning or numerical optimization.

## Key Features

- **Surrogate Models**: MatCraft trains lightweight MLP (multi-layer perceptron) neural networks on your experimental or simulation data. These surrogates approximate expensive physics calculations in milliseconds, enabling rapid exploration of vast composition spaces.
- **CMA-ES Optimization**: The platform uses Covariance Matrix Adaptation Evolution Strategy (CMA-ES) to intelligently search the material parameter space. CMA-ES is a derivative-free optimizer well-suited for noisy, non-convex objective landscapes common in materials science.
- **Active Learning**: Rather than requiring thousands of data points up front, MatCraft uses acquisition functions (Expected Improvement, Upper Confidence Bound, etc.) to suggest the most informative experiments to run next, drastically reducing the number of costly evaluations needed.
- **Pareto Multi-Objective Optimization**: Real materials must balance competing properties -- for example, maximizing ionic conductivity while minimizing cost. MatCraft computes and visualizes Pareto fronts so you can make informed trade-off decisions.
- **16 Material Domains**: Out of the box, MatCraft ships with validated domain plugins for water membranes, lithium-ion batteries, perovskite solar cells, thermoelectrics, catalysts, polymer composites, and more.

MatCraft is available as a self-hosted platform with a FastAPI backend, a Next.js frontend dashboard, a Python SDK for programmatic access, and a CLI for scripting and CI/CD integration.`,
    category: "general",
    order: 0,
    relatedSlugs: ["how-does-matcraft-work", "who-is-matcraft-for"],
    tags: ["overview", "introduction"],
  },
  {
    slug: "how-does-matcraft-work",
    question: "How does MatCraft work?",
    answer: `MatCraft follows a structured pipeline to go from raw material data to optimized compositions. Here is the end-to-end workflow:

## 1. Define Your Material

You start by creating a **Material** definition -- either through the web UI, a YAML configuration file, or the Python SDK. A material definition specifies:

- **Components**: The elements or constituents that make up your material (e.g., polymer type, filler concentration, solvent ratio).
- **Parameters**: Continuous or discrete variables with bounds that define the search space.
- **Objectives**: The properties you want to optimize (e.g., maximize tensile strength, minimize permeability).
- **Constraints**: Hard limits that valid compositions must satisfy (e.g., component fractions must sum to 1.0).

## 2. Seed with Data

Import initial experimental data -- as few as 10-20 data points -- via CSV, JSON, or direct API calls. MatCraft uses this seed data to train an initial surrogate model.

## 3. Run a Campaign

A **Campaign** orchestrates the optimization loop. In each iteration, the surrogate model proposes candidate compositions, an acquisition function ranks them, and the top candidates are either evaluated by a physics model or flagged for experimental validation.

## 4. Iterate with Active Learning

The active learning loop automatically retrains the surrogate as new data arrives, refining its predictions and focusing the search on the most promising regions of the design space. Most campaigns converge in 5-15 iterations.

## 5. Analyze Results

The dashboard provides interactive Pareto plots, convergence charts, and exportable reports. You can compare campaigns, drill into individual candidates, and export optimized compositions for lab validation.`,
    category: "general",
    order: 1,
    relatedSlugs: ["what-is-matcraft", "what-is-active-learning", "what-is-pareto-front"],
    tags: ["workflow", "pipeline", "overview"],
  },
  {
    slug: "who-is-matcraft-for",
    question: "Who is MatCraft for?",
    answer: `MatCraft is built for anyone involved in materials development who wants to reduce the time and cost of discovering optimal compositions. The platform is designed to be accessible to domain experts who may not have a background in machine learning.

## Primary Users

- **Materials Scientists & Engineers**: Researchers working on formulation optimization in academia or industry. MatCraft handles the ML and optimization so you can focus on domain expertise and experimental validation.
- **R&D Teams**: Product development groups that need to systematically explore material design spaces. MatCraft's campaign system supports collaborative workflows where multiple team members contribute data and review results.
- **Computational Chemists & Physicists**: Practitioners who run DFT, molecular dynamics, or other simulations. MatCraft can wrap your simulation codes as evaluation backends, then use surrogates to minimize the number of expensive runs needed.
- **Data Scientists in Materials**: ML practitioners who want a structured framework for Bayesian-style optimization rather than building custom pipelines from scratch.

## Use Cases

- Formulating water purification membranes with optimal flux-rejection trade-offs
- Designing battery electrolyte compositions for maximum ionic conductivity
- Optimizing perovskite solar cell absorber layers for efficiency and stability
- Discovering polymer blends that balance mechanical strength and processability
- Screening catalyst compositions for selectivity and activity

## Skill Level

No machine learning expertise is required for basic usage. The YAML-based configuration and guided UI walk you through setting up a campaign. Advanced users can customize surrogate architectures, write custom acquisition functions, or integrate external simulation codes via the Python SDK.`,
    category: "general",
    order: 2,
    relatedSlugs: ["what-is-matcraft", "what-domains-supported"],
    tags: ["audience", "use-cases"],
  },
  {
    slug: "is-matcraft-open-source",
    question: "Is MatCraft open source?",
    answer: `Yes, MatCraft's core optimization engine is open source under the Apache 2.0 license. This includes the Python library (\`materia\`), which contains the surrogate model framework, CMA-ES optimizer, active learning loop, Pareto analysis, and all 16 built-in domain plugins.

## What Is Open Source

- **Core Library** (\`src/materia/\`): All optimization, surrogate modeling, active learning, and domain plugin code.
- **CLI** (\`materia\` command): The command-line interface for running campaigns, importing data, and exporting results.
- **Domain Plugins**: All 16 material domain definitions, including physics models and parameter schemas.
- **Tests & Examples**: Full test suite and example configurations.

## What Is Source-Available / Commercial

- **Web Dashboard** (Next.js frontend): The browser-based UI with interactive visualizations, team collaboration features, and campaign management is available under a source-available license. It is free for individual and academic use; commercial teams require a paid license.
- **Managed Cloud Service**: The hosted version at matcraft.io handles infrastructure, scaling, and backups for you. This is a paid service with a free tier.
- **Enterprise Features**: SSO/SAML integration, audit logging, priority support, and custom SLAs require an enterprise license.

## Contributing

We welcome contributions to the core library. See our contributing guide for details on submitting pull requests, running the test suite, and our code review process. All contributors must sign a Contributor License Agreement (CLA).

You can install the open-source core directly from PyPI:

\`\`\`bash
pip install matcraft
\`\`\``,
    category: "general",
    order: 3,
    relatedSlugs: ["contributing-guide", "free-tier-limits"],
    tags: ["open-source", "licensing"],
  },
  {
    slug: "what-languages-supported",
    question: "What programming languages does MatCraft support?",
    answer: `MatCraft is primarily a Python-based platform, but it provides multiple integration points so you can work in your preferred environment.

## Python (Primary)

The core library and SDK are written in Python 3.10+. This is the most fully-featured way to interact with MatCraft:

\`\`\`python
from materia import Campaign, Material

material = Material.from_yaml("my_material.yaml")
campaign = Campaign(material=material, max_iterations=20)
campaign.run()
print(campaign.best_candidates(n=5))
\`\`\`

## REST API (Language-Agnostic)

The FastAPI backend exposes a comprehensive REST API. Any language that can make HTTP requests can interact with MatCraft:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/campaigns \\
  -H "Authorization: Bearer $MATCRAFT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"material_id": "mem-001", "max_iterations": 20}'
\`\`\`

## CLI

The \`materia\` CLI is useful for scripting, CI/CD pipelines, and quick interactions:

\`\`\`bash
materia campaign run --config campaign.yaml --output results/
materia data import --file measurements.csv --material mem-001
\`\`\`

## YAML Configuration

Most users define their materials and campaigns using YAML files, which require no programming at all. The YAML schema is fully documented and validated at load time.

## Jupyter Notebooks

MatCraft integrates well with Jupyter for interactive exploration. The SDK includes built-in visualization helpers that render Pareto plots and convergence charts directly in notebook cells.

## Future Language SDKs

We are evaluating TypeScript/JavaScript and Julia SDKs based on community demand. If you need a specific language binding, please open a feature request on GitHub.`,
    category: "general",
    order: 4,
    relatedSlugs: ["how-to-use-python-sdk", "system-architecture"],
    tags: ["languages", "sdk", "api"],
  },
  {
    slug: "data-privacy-policy",
    question: "How does MatCraft handle data privacy?",
    answer: `MatCraft takes data privacy seriously. Materials research data is often proprietary, and we have designed the platform with multiple layers of protection.

## Self-Hosted Deployment

The recommended approach for sensitive data is self-hosting. When you run MatCraft on your own infrastructure, your data never leaves your network. The platform requires only a PostgreSQL database and optional Redis for task queuing -- no external telemetry or phone-home calls are made.

## Cloud Service Data Handling

If you use the managed cloud service at matcraft.io:

- **Data Isolation**: Each organization's data is stored in a logically isolated database schema. There is no cross-tenant data access.
- **Encryption**: All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Database backups are encrypted with customer-specific keys on Enterprise plans.
- **Retention**: You own your data. You can export all materials, campaigns, and results at any time via the API or dashboard. When you delete data, it is permanently removed from primary storage within 24 hours and from backups within 30 days.
- **Access Controls**: Role-based access control (RBAC) lets you define who can view, edit, or delete materials and campaigns within your organization.
- **Compliance**: The cloud service is hosted on AWS (us-east-1 and eu-west-1 regions). We are SOC 2 Type II compliant and can provide a Data Processing Agreement (DPA) for enterprise customers.

## No Training on Your Data

MatCraft does **not** use your material data to train any shared models. Your surrogate models are trained exclusively on your data and are never accessible to other users or used to improve the platform's general models.

## GDPR

For EU users, we comply with GDPR requirements including data portability, right to erasure, and data processing transparency. Contact privacy@matcraft.io for details.`,
    category: "general",
    order: 5,
    relatedSlugs: ["enterprise-features", "cloud-deployment-guide"],
    tags: ["privacy", "security", "compliance"],
  },
  {
    slug: "matcraft-vs-competitors",
    question: "How does MatCraft compare to other materials optimization tools?",
    answer: `MatCraft occupies a unique position in the materials informatics landscape by combining surrogate-driven optimization with domain-specific plugins in a single, integrated platform. Here is how it compares to common alternatives:

## vs. General Bayesian Optimization Libraries (BoTorch, Ax, Optuna)

These are excellent general-purpose optimizers, but they require significant setup work for materials problems. You need to implement your own parameter constraints, material-specific physics, and multi-objective handling. MatCraft provides all of this out of the box, with domain plugins that encode material-specific knowledge like composition constraints (fractions summing to 1.0) and physically meaningful parameter bounds.

## vs. Materials Databases (Materials Project, AFLOW, NOMAD)

These platforms focus on storing and querying existing materials data from DFT calculations. MatCraft is complementary -- you can import data from these databases as seed data for optimization campaigns. MatCraft's strength is in the *optimization* workflow: actively searching for new compositions rather than mining existing ones.

## vs. Custom ML Pipelines (scikit-learn, PyTorch)

Building your own surrogate + optimizer pipeline gives you maximum flexibility but requires substantial ML engineering effort. MatCraft handles the boilerplate -- model training, active learning scheduling, convergence detection, Pareto computation, and result visualization -- so your team can focus on domain science.

## vs. Commercial Platforms (Citrine, Uncountable)

MatCraft differentiates through its open-source core, self-hosting option, and transparent optimization algorithms. You are never locked into a vendor. The CMA-ES + MLP surrogate approach is well-understood and auditable, unlike black-box commercial solutions. MatCraft also offers a generous free tier for academics and small teams.

## When to Choose MatCraft

MatCraft is the best fit when you need multi-objective optimization with domain-aware constraints, want transparency into the optimization process, and prefer the flexibility of self-hosting or an open-source core.`,
    category: "general",
    order: 6,
    relatedSlugs: ["what-is-matcraft", "what-is-cma-es"],
    tags: ["comparison", "alternatives"],
  },
  {
    slug: "community-support",
    question: "How can I get help and join the MatCraft community?",
    answer: `MatCraft has an active community of materials scientists, ML practitioners, and engineers. Here are all the ways to get help and connect:

## GitHub Discussions

The primary forum for questions, feature requests, and community interaction is [GitHub Discussions](https://github.com/matcraft/matcraft/discussions). This is the best place for:

- Usage questions and troubleshooting
- Feature requests and design discussions
- Sharing your optimization results and case studies
- Connecting with other users working on similar materials

## Bug Reports & Issues

If you encounter a bug, please open an issue on the [GitHub issue tracker](https://github.com/matcraft/matcraft/issues) with:

- Your MatCraft version (\`materia --version\`)
- A minimal reproducible example
- Relevant log output

## Documentation

Comprehensive documentation is available at [docs.matcraft.io](https://docs.matcraft.io), including:

- Getting started tutorials
- API reference (auto-generated from source)
- YAML configuration schema reference
- Domain plugin guides for each of the 16 supported materials

## Discord

Join our Discord server for real-time chat with the community and maintainers. We have channels organized by topic: \`#general\`, \`#optimization-help\`, \`#domain-plugins\`, \`#show-and-tell\`, and \`#contributing\`.

## Office Hours

The core team holds monthly virtual office hours (first Thursday of each month, 11am ET) where anyone can ask questions, demo their work, or discuss upcoming features. Recordings are posted to our YouTube channel.

## Enterprise Support

Paid plans include email support with guaranteed response times. Enterprise customers receive a dedicated Slack channel and access to the engineering team for custom integration assistance. See our pricing page for details.`,
    category: "general",
    order: 7,
    relatedSlugs: ["contributing-guide", "enterprise-features"],
    tags: ["community", "support", "help"],
  },
];

export default faqs;
