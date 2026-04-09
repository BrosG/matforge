import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "how-to-create-account",
    question: "How do I create a MatCraft account?",
    answer: `Creating a MatCraft account takes less than two minutes. You have several options depending on whether you want to use the hosted cloud service or a self-hosted instance.

## Cloud Service (matcraft.io)

1. Visit [matcraft.io/signup](https://matcraft.io/signup).
2. Sign up with your email address or use OAuth via GitHub or Google.
3. Verify your email address by clicking the link sent to your inbox.
4. Choose your plan -- the **Free** tier includes 3 active campaigns and 1,000 evaluations per month, which is enough for most individual researchers.
5. You will be dropped into the dashboard with a guided onboarding tour.

## Self-Hosted Instance

If your organization runs a self-hosted MatCraft deployment, your administrator will provide the URL. Account creation depends on your organization's identity provider:

- **Local accounts**: Navigate to \`https://your-instance.com/signup\` and register with email/password.
- **SSO/SAML**: Click "Sign in with SSO" and authenticate through your organization's identity provider (Okta, Azure AD, etc.). Your account is created automatically on first login.

## API Token

After creating your account, generate an API token for CLI and SDK usage:

1. Go to **Settings > API Tokens** in the dashboard.
2. Click **Generate New Token**.
3. Copy the token and store it securely. Set it as an environment variable:

\`\`\`bash
export MATCRAFT_TOKEN="mc_live_abc123..."
\`\`\`

4. Verify connectivity:

\`\`\`bash
materia auth whoami
\`\`\`

Your token has the same permissions as your user account. For CI/CD pipelines, we recommend creating a dedicated service account with limited permissions.`,
    category: "getting-started",
    order: 0,
    relatedSlugs: ["how-to-create-first-campaign", "how-to-use-python-sdk"],
    tags: ["account", "signup", "authentication"],
  },
  {
    slug: "how-to-create-first-campaign",
    question: "How do I create my first optimization campaign?",
    answer: `A campaign is the central unit of work in MatCraft. It ties together a material definition, seed data, a surrogate model, and an optimization strategy. Here is how to launch your first campaign in three steps.

## Step 1: Define Your Material

Create a YAML file describing your material's design space:

\`\`\`yaml
# my_material.yaml
name: "polymer-membrane-v1"
domain: water_membrane
components:
  - name: polymer_concentration
    type: continuous
    bounds: [0.05, 0.40]
    unit: "wt%"
  - name: additive_loading
    type: continuous
    bounds: [0.0, 0.15]
    unit: "wt%"
  - name: crosslinker_ratio
    type: continuous
    bounds: [0.01, 0.10]
objectives:
  - name: water_flux
    direction: maximize
    unit: "L/m2/h"
  - name: salt_rejection
    direction: maximize
    unit: "%"
\`\`\`

## Step 2: Import Seed Data

Provide initial measurements in CSV format:

\`\`\`bash
materia data import --material my_material.yaml --file initial_data.csv
\`\`\`

Your CSV should have columns matching each component name and objective name. A minimum of 10 data points is recommended; 20-30 points will produce a more reliable initial surrogate.

## Step 3: Launch the Campaign

\`\`\`bash
materia campaign run \\
  --config my_material.yaml \\
  --max-iterations 15 \\
  --batch-size 5 \\
  --output results/
\`\`\`

Or via the Python SDK:

\`\`\`python
from materia import Campaign, Material

material = Material.from_yaml("my_material.yaml")
campaign = Campaign(
    material=material,
    max_iterations=15,
    batch_size=5,
)
campaign.run()
campaign.export("results/")
\`\`\`

The campaign will train an initial surrogate, then iteratively propose candidates, evaluate them, and retrain. Progress is displayed in real-time on the dashboard or in terminal output. Typical campaigns with 3-5 parameters converge in 8-15 iterations.`,
    category: "getting-started",
    order: 1,
    relatedSlugs: ["how-to-write-yaml-config", "how-to-import-data", "what-is-cma-es"],
    tags: ["campaign", "quickstart", "tutorial"],
  },
  {
    slug: "how-to-import-data",
    question: "How do I import experimental data into MatCraft?",
    answer: `MatCraft supports multiple data import formats and methods. Your data forms the foundation for surrogate model training, so getting it right is important.

## Supported Formats

- **CSV** (recommended for tabular data)
- **JSON** (for structured or nested data)
- **Excel** (.xlsx) via the dashboard upload
- **Programmatic** via the Python SDK or REST API

## CSV Import

The simplest approach is a CSV file with columns for each component and objective:

\`\`\`csv
polymer_concentration,additive_loading,crosslinker_ratio,water_flux,salt_rejection
0.15,0.05,0.03,45.2,92.1
0.20,0.08,0.05,38.7,95.3
0.25,0.10,0.04,32.1,97.0
\`\`\`

Import via CLI:

\`\`\`bash
materia data import --material mem-001 --file measurements.csv
\`\`\`

## Python SDK

For programmatic import, especially when transforming data from other tools:

\`\`\`python
import pandas as pd
from materia import Material
from materia.io import import_data

df = pd.read_csv("lab_results.csv")
# Rename columns if needed
df = df.rename(columns={"flux_lmh": "water_flux", "rejection_pct": "salt_rejection"})

material = Material.from_yaml("my_material.yaml")
import_data(material, df)
\`\`\`

## Data Validation

MatCraft validates imported data against your material definition:

- **Bounds checking**: Values outside component bounds are flagged as warnings (not rejected, since real measurements can exceed expected ranges).
- **Missing values**: Rows with missing objective values are accepted but excluded from surrogate training. Missing component values cause the row to be rejected.
- **Duplicates**: Exact duplicate rows are detected and deduplicated with a warning.
- **Type coercion**: String values in numeric columns are automatically parsed where possible.

## Best Practices

- Start with at least 10 data points; 20-50 is ideal for 3-5 dimensional spaces.
- Include points spread across the design space, not just near known optima.
- If you have data from different experimental batches, include a batch column -- MatCraft can account for batch effects in surrogate training.`,
    category: "getting-started",
    order: 2,
    relatedSlugs: ["how-to-create-first-campaign", "how-surrogate-models-work"],
    tags: ["data", "import", "csv"],
  },
  {
    slug: "how-to-write-yaml-config",
    question: "How do I write a YAML configuration file for MatCraft?",
    answer: `YAML configuration files are the primary way to define materials and campaigns in MatCraft. The schema is designed to be readable and self-documenting.

## Material Definition

A material YAML defines the design space -- what can vary and what you want to optimize:

\`\`\`yaml
name: "lithium-ion-cathode-v2"
domain: battery
description: "NMC cathode composition optimization"

components:
  - name: nickel_fraction
    type: continuous
    bounds: [0.3, 0.9]
    description: "Ni molar fraction in NMC"
  - name: manganese_fraction
    type: continuous
    bounds: [0.05, 0.4]
  - name: cobalt_fraction
    type: continuous
    bounds: [0.05, 0.3]
  - name: coating_thickness
    type: continuous
    bounds: [1.0, 20.0]
    unit: "nm"

constraints:
  - type: sum_equals
    components: [nickel_fraction, manganese_fraction, cobalt_fraction]
    value: 1.0
    tolerance: 0.001

objectives:
  - name: specific_capacity
    direction: maximize
    unit: "mAh/g"
  - name: cycle_retention
    direction: maximize
    unit: "%"
    description: "Capacity retention after 500 cycles"
  - name: material_cost
    direction: minimize
    unit: "$/kg"
\`\`\`

## Campaign Configuration

Campaign settings can be included in the same file or a separate one:

\`\`\`yaml
campaign:
  max_iterations: 20
  batch_size: 5
  surrogate:
    type: mlp
    hidden_layers: [64, 64]
    learning_rate: 0.001
    epochs: 200
  acquisition:
    type: expected_improvement
    exploration_weight: 0.1
  convergence:
    patience: 5
    min_improvement: 0.01
\`\`\`

## Key Schema Rules

- **component types**: \`continuous\`, \`discrete\`, or \`categorical\`. Categorical components use \`choices\` instead of \`bounds\`.
- **objective directions**: \`maximize\` or \`minimize\`.
- **constraint types**: \`sum_equals\`, \`sum_lte\`, \`ratio_between\`, or \`custom\` (with a Python expression).
- All numeric bounds are inclusive.
- The \`domain\` field is optional but enables domain-specific physics models and validation.

## Validation

Validate your YAML before launching a campaign:

\`\`\`bash
materia config validate my_material.yaml
\`\`\`

This checks for schema errors, bound consistency, constraint feasibility, and warns about potential issues like very high-dimensional spaces or tight constraints.`,
    category: "getting-started",
    order: 3,
    relatedSlugs: ["how-to-create-first-campaign", "domain-parameters-explained"],
    tags: ["yaml", "configuration", "schema"],
  },
  {
    slug: "how-to-run-locally",
    question: "How do I run MatCraft locally?",
    answer: `MatCraft can run entirely on your local machine for development, testing, or air-gapped environments. There are two approaches: using just the Python core library, or running the full platform stack.

## Core Library Only (Simplest)

If you only need the optimization engine without the web dashboard:

\`\`\`bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate

# Install the core library
pip install matcraft

# Verify installation
materia --version
\`\`\`

This gives you the CLI, Python SDK, all domain plugins, and the surrogate/optimizer stack. No database or additional services are required -- campaign state is stored in local SQLite by default.

## Full Platform Stack

To run the complete platform including the web dashboard, API server, and task queue:

### Prerequisites

- Python 3.10+
- Node.js 18+ and pnpm
- PostgreSQL 14+
- Redis 7+ (for Celery task queue)

### Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/matcraft/matcraft.git
cd matcraft

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env  # Edit with your database credentials

# Run database migrations
materia db upgrade

# Start the API server
uvicorn materia.api:app --reload --port 8000

# In a separate terminal, start the Celery worker
celery -A materia.tasks worker --loglevel=info
\`\`\`

\`\`\`bash
# Frontend (in another terminal)
cd frontend
pnpm install
pnpm dev  # Starts on http://localhost:3000
\`\`\`

### Environment Variables

Key variables in your \`.env\` file:

\`\`\`
DATABASE_URL=postgresql://user:pass@localhost:5432/matcraft
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
MATCRAFT_ENV=development
\`\`\`

The development server includes hot-reloading for both frontend and backend changes.`,
    category: "getting-started",
    order: 4,
    relatedSlugs: ["how-to-use-docker", "database-requirements"],
    tags: ["local", "installation", "development"],
  },
  {
    slug: "how-to-use-docker",
    question: "How do I run MatCraft with Docker?",
    answer: `Docker is the recommended way to run the full MatCraft platform locally or in production. We provide pre-built images and a Docker Compose configuration that sets up all services.

## Quick Start with Docker Compose

\`\`\`bash
# Clone the repository
git clone https://github.com/matcraft/matcraft.git
cd matcraft

# Copy and configure environment
cp .env.example .env
# Edit .env with your preferred settings (or use defaults for local dev)

# Start all services
docker compose up -d
\`\`\`

This starts five containers:

| Service | Port | Description |
|---------|------|-------------|
| \`matcraft-api\` | 8000 | FastAPI backend |
| \`matcraft-frontend\` | 3000 | Next.js dashboard |
| \`matcraft-worker\` | -- | Celery task worker |
| \`matcraft-db\` | 5432 | PostgreSQL database |
| \`matcraft-redis\` | 6379 | Redis for task queue |

## Docker Compose File

The \`docker-compose.yml\` includes sensible defaults:

\`\`\`yaml
services:
  api:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [db, redis]
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://api:8000
  worker:
    build: ./backend
    command: celery -A materia.tasks worker --loglevel=info --concurrency=4
    env_file: .env
    depends_on: [db, redis]
  db:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: matcraft
      POSTGRES_USER: matcraft
      POSTGRES_PASSWORD: matcraft
  redis:
    image: redis:7-alpine
\`\`\`

## GPU Support

For GPU-accelerated surrogate training, use the NVIDIA Container Toolkit:

\`\`\`bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
\`\`\`

## Production Considerations

- Mount a persistent volume for PostgreSQL data.
- Use a managed PostgreSQL service (RDS, Cloud SQL) for production workloads.
- Set strong passwords and a secure \`SECRET_KEY\` in your \`.env\` file.
- Configure a reverse proxy (nginx, Traefik) with TLS termination in front of the API and frontend.
- Scale workers horizontally by increasing the \`--concurrency\` flag or running multiple worker containers.`,
    category: "getting-started",
    order: 5,
    relatedSlugs: ["how-to-run-locally", "how-to-deploy-cloud"],
    tags: ["docker", "containers", "deployment"],
  },
  {
    slug: "how-to-deploy-cloud",
    question: "How do I deploy MatCraft to the cloud?",
    answer: `MatCraft can be deployed to any cloud provider. We provide Terraform modules and Helm charts for the most common platforms.

## AWS (Recommended)

Our Terraform module sets up a production-ready deployment on AWS:

\`\`\`bash
cd deploy/terraform/aws

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings

terraform init
terraform plan
terraform apply
\`\`\`

This provisions:

- **ECS Fargate** for the API, frontend, and worker containers (serverless, no EC2 instances to manage)
- **RDS PostgreSQL** with automated backups and Multi-AZ for high availability
- **ElastiCache Redis** for the task queue
- **ALB** with TLS termination using ACM certificates
- **CloudWatch** for logging and monitoring

Estimated cost: ~$150-300/month for a small team deployment.

## Google Cloud Platform

\`\`\`bash
cd deploy/terraform/gcp
terraform init && terraform apply
\`\`\`

Uses Cloud Run, Cloud SQL, and Memorystore.

## Kubernetes (Any Cloud)

For teams already running Kubernetes, we provide a Helm chart:

\`\`\`bash
helm repo add matcraft https://charts.matcraft.io
helm install matcraft matcraft/matcraft \\
  --namespace matcraft \\
  --set api.replicas=2 \\
  --set worker.replicas=3 \\
  --set postgresql.enabled=true \\
  --set redis.enabled=true
\`\`\`

## Key Configuration

Regardless of cloud provider, ensure you configure:

- **Database backups**: Enable automated daily backups with at least 7 days retention.
- **TLS**: All traffic should be encrypted. Use your cloud provider's certificate manager.
- **Secrets management**: Store database credentials and API keys in your cloud's secrets manager (AWS Secrets Manager, GCP Secret Manager, etc.), not in environment variables or config files.
- **Monitoring**: Set up alerts for API error rates, worker queue depth, and database connection pool usage.

## Scaling

MatCraft scales horizontally. The API servers are stateless and can be load-balanced. Workers can be scaled independently based on campaign workload. The database is typically the bottleneck -- use read replicas for dashboard queries if needed.`,
    category: "getting-started",
    order: 6,
    relatedSlugs: ["how-to-use-docker", "cloud-deployment-guide", "scaling-campaigns"],
    tags: ["cloud", "deployment", "aws", "kubernetes"],
  },
  {
    slug: "how-to-use-python-sdk",
    question: "How do I use the MatCraft Python SDK?",
    answer: `The Python SDK (\`materia\`) gives you full programmatic control over MatCraft. It is the most flexible way to interact with the platform and is ideal for integration into existing Python workflows, Jupyter notebooks, and CI/CD pipelines.

## Installation

\`\`\`bash
pip install matcraft
\`\`\`

For GPU-accelerated surrogate training:

\`\`\`bash
pip install matcraft[gpu]
\`\`\`

## Basic Workflow

\`\`\`python
from materia import Campaign, Material
from materia.surrogate import MLPSurrogate
from materia.optimize import CMAESOptimizer
from materia.active_learning import ActiveLearningLoop

# 1. Define material from YAML or programmatically
material = Material(
    name="my-alloy",
    components=[
        {"name": "iron", "type": "continuous", "bounds": [0.5, 0.95]},
        {"name": "chromium", "type": "continuous", "bounds": [0.05, 0.3]},
        {"name": "nickel", "type": "continuous", "bounds": [0.0, 0.2]},
    ],
    objectives=[
        {"name": "hardness", "direction": "maximize"},
        {"name": "corrosion_resistance", "direction": "maximize"},
    ],
    constraints=[
        {"type": "sum_equals", "components": ["iron", "chromium", "nickel"], "value": 1.0},
    ],
)

# 2. Load seed data
import pandas as pd
data = pd.read_csv("initial_measurements.csv")
material.add_data(data)

# 3. Configure and run campaign
campaign = Campaign(
    material=material,
    surrogate=MLPSurrogate(hidden_layers=[64, 64]),
    optimizer=CMAESOptimizer(sigma0=0.3),
    max_iterations=20,
    batch_size=5,
)

# Run the full optimization loop
results = campaign.run()

# 4. Analyze results
print(results.best_candidates(n=10))
print(results.pareto_front())
results.plot_convergence()  # Renders in Jupyter or saves to file
\`\`\`

## Connecting to a Remote Server

\`\`\`python
from materia import Client

client = Client(
    base_url="https://api.matcraft.io",
    token="mc_live_abc123...",
)

# List existing campaigns
campaigns = client.campaigns.list()

# Create a new campaign on the server
campaign = client.campaigns.create(
    material_id="mat-001",
    max_iterations=20,
)

# Stream real-time updates
for event in client.campaigns.stream(campaign.id):
    print(f"Iteration {event.iteration}: best = {event.best_value}")
\`\`\`

## Key SDK Classes

| Class | Purpose |
|-------|---------|
| \`Material\` | Define components, objectives, constraints |
| \`Campaign\` | Orchestrate the optimization loop |
| \`MLPSurrogate\` | Neural network surrogate model |
| \`CMAESOptimizer\` | CMA-ES optimization strategy |
| \`ActiveLearningLoop\` | Acquisition-driven iteration |
| \`Client\` | Remote API client |

The SDK is fully typed with comprehensive docstrings. Use your IDE's autocomplete or run \`help(Campaign)\` in a Python REPL for detailed parameter documentation.`,
    category: "getting-started",
    order: 7,
    relatedSlugs: ["what-languages-supported", "how-to-create-first-campaign"],
    tags: ["python", "sdk", "programming"],
  },
];

export default faqs;
