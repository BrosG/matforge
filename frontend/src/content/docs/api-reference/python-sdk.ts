import { DocPage } from "../index";

const page: DocPage = {
  slug: "python-sdk",
  title: "Python SDK",
  description: "Programmatic access to MatCraft via the official Python client library.",
  category: "api-reference",
  order: 9,
  lastUpdated: "2026-04-01",
  tags: ["api", "sdk", "python", "client"],
  readingTime: 8,
  body: `
## Python SDK

The MatCraft Python SDK (\`matcraft-sdk\`) provides a high-level, Pythonic interface to the MatCraft REST API. It handles authentication, serialization, error handling, and pagination automatically.

### Installation

\`\`\`bash
pip install matcraft-sdk
\`\`\`

### Quick Start

\`\`\`python
from matcraft import MatCraftClient

# Initialize with API key (or set MATERIA_API_KEY env var)
client = MatCraftClient(api_key="mc_live_sk_...")

# Create a campaign from an MDL file
campaign = client.campaigns.create(mdl_path="material.yaml")

# Start the campaign
campaign.start()

# Wait for completion and get results
results = campaign.wait()

# View Pareto front
for solution in results.pareto_front:
    print(f"Params: {solution.parameters}")
    print(f"Objectives: {solution.objectives}")
\`\`\`

### Client Configuration

\`\`\`python
client = MatCraftClient(
    api_key="mc_live_sk_...",          # API key
    base_url="https://api.matcraft.io", # API base URL
    timeout=30,                         # Request timeout in seconds
    max_retries=3,                      # Auto-retry on transient errors
)
\`\`\`

Or use environment variables:

\`\`\`bash
export MATERIA_API_KEY="mc_live_sk_..."
export MATERIA_API_URL="https://api.matcraft.io"
\`\`\`

\`\`\`python
client = MatCraftClient()  # Reads from environment
\`\`\`

### Campaigns

#### Create from MDL file

\`\`\`python
campaign = client.campaigns.create(mdl_path="material.yaml")
\`\`\`

#### Create from dictionary

\`\`\`python
campaign = client.campaigns.create(
    name="my-campaign",
    domain="water",
    parameters=[
        {"name": "concentration", "type": "continuous", "bounds": [0.1, 0.4]},
        {"name": "temperature", "type": "continuous", "bounds": [20, 80]},
    ],
    objectives=[
        {"name": "permeability", "direction": "maximize"},
        {"name": "rejection", "direction": "maximize"},
    ],
    optimizer={"method": "cma-es", "budget": 200},
)
\`\`\`

#### Create from template

\`\`\`python
campaign = client.campaigns.create_from_template(
    template="battery/nmc-cathode",
    name="my-nmc-study",
    overrides={"optimizer": {"budget": 500}},
)
\`\`\`

#### List campaigns

\`\`\`python
campaigns = client.campaigns.list(status="completed", domain="water")
for c in campaigns:
    print(f"{c.name}: {c.status} (HV={c.hypervolume:.3f})")
\`\`\`

#### Start and monitor

\`\`\`python
campaign.start()

# Block until complete
results = campaign.wait(poll_interval=5)

# Or monitor with a callback
def on_progress(progress):
    print(f"Iter {progress.iteration}: HV={progress.hypervolume:.4f}")

results = campaign.wait(callback=on_progress)
\`\`\`

#### Get results

\`\`\`python
results = campaign.results()

# Full Pareto front
print(f"Pareto solutions: {len(results.pareto_front)}")
print(f"Hypervolume: {results.hypervolume:.4f}")

# Access individual solutions
best = results.pareto_front[0]
print(f"Parameters: {best.parameters}")
print(f"Objectives: {best.objectives}")

# Export to pandas DataFrame
df = results.to_dataframe()
df.to_csv("results.csv", index=False)
\`\`\`

### Datasets

\`\`\`python
# Upload a dataset
dataset = client.datasets.upload(
    path="historical_data.csv",
    name="lab-experiments-2025",
)

# Warm-start a campaign with historical data
campaign = client.campaigns.create(
    mdl_path="material.yaml",
    dataset_id=dataset.id,
)

# List datasets
datasets = client.datasets.list()

# Download a dataset
client.datasets.download(dataset.id, output_path="data.csv")
\`\`\`

### Templates

\`\`\`python
# Browse templates
templates = client.templates.list(domain="solar")
for t in templates:
    print(f"{t.slug}: {t.description}")

# Get template details
template = client.templates.get("solar/perovskite")
print(template.mdl)

# Download as YAML
client.templates.download("solar/perovskite", output_path="material.yaml")
\`\`\`

### Async Support

The SDK provides an async client for use with asyncio:

\`\`\`python
import asyncio
from matcraft import AsyncMatCraftClient

async def main():
    client = AsyncMatCraftClient()

    campaign = await client.campaigns.create(mdl_path="material.yaml")
    await campaign.start()

    # Stream progress via WebSocket
    async for progress in campaign.stream():
        print(f"Iter {progress.iteration}: HV={progress.hypervolume:.4f}")
        if progress.status == "completed":
            break

    results = await campaign.results()
    print(f"Pareto solutions: {len(results.pareto_front)}")

asyncio.run(main())
\`\`\`

### Error Handling

\`\`\`python
from matcraft.exceptions import (
    MatCraftAPIError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    AuthenticationError,
)

try:
    campaign = client.campaigns.create(mdl_path="invalid.yaml")
except ValidationError as e:
    print(f"MDL errors: {e.details}")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError as e:
    print(f"Rate limited, retry after {e.retry_after}s")
except MatCraftAPIError as e:
    print(f"API error: {e.code} - {e.message}")
\`\`\`

### Type Hints

The SDK is fully typed with Python type hints and works with mypy, pyright, and IDE autocompletion:

\`\`\`python
from matcraft.types import Campaign, Results, ParetoSolution

campaign: Campaign = client.campaigns.get("camp_abc123")
results: Results = campaign.results()
solution: ParetoSolution = results.pareto_front[0]
\`\`\`
`,
};

export default page;
