import { DocPage } from "../index";

const page: DocPage = {
  slug: "installation",
  title: "Installation",
  description: "Install MatCraft and configure your environment for materials optimization.",
  category: "getting-started",
  order: 1,
  lastUpdated: "2026-04-01",
  tags: ["installation", "setup", "python", "docker"],
  readingTime: 7,
  body: `
## Installation

MatCraft consists of three components: the **MATERIA engine** (Python library and CLI), the **backend API** (FastAPI), and the **frontend dashboard** (Next.js). Most users only need the MATERIA engine. The full stack is required for team-based workflows or the web dashboard.

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Python | 3.10 | 3.12 |
| RAM | 4 GB | 16 GB |
| Disk | 500 MB | 5 GB |
| GPU | None | CUDA 12.x (for GNN surrogates) |
| OS | Linux, macOS, Windows | Linux (Ubuntu 22.04+) |

### Install via pip

The simplest installation method uses pip:

\`\`\`bash
pip install materia
\`\`\`

This installs the core optimization engine with CMA-ES, MLP surrogates, and all 16 built-in domains. To include optional dependencies for graph neural network surrogates (CHGNet, MACE):

\`\`\`bash
pip install materia[gnn]
\`\`\`

For development and testing:

\`\`\`bash
pip install materia[dev]
\`\`\`

### Install via conda

If you prefer conda for environment management:

\`\`\`bash
conda create -n matcraft python=3.12
conda activate matcraft
pip install materia
\`\`\`

### Docker Deployment

For the full MatCraft stack (backend + frontend + worker), use Docker Compose:

\`\`\`bash
git clone https://github.com/matcraft/matforge.git
cd matforge
cp .env.example .env
docker-compose up -d
\`\`\`

This starts three services:

- **matcraft-api** on port 8000 -- FastAPI backend with REST and WebSocket endpoints
- **matcraft-web** on port 3000 -- Next.js frontend dashboard
- **matcraft-worker** -- Background job processor for optimization campaigns

Edit the \`.env\` file to configure database connections, API keys, and worker concurrency.

### GPU Support

MLP surrogates run efficiently on CPU. For GNN-based surrogates (CHGNet, MACE, or ONNX models), GPU acceleration is strongly recommended:

\`\`\`bash
# Install with CUDA 12 support
pip install materia[gnn] --extra-index-url https://download.pytorch.org/whl/cu121
\`\`\`

Verify GPU availability:

\`\`\`python
import torch
print(torch.cuda.is_available())  # Should print True
\`\`\`

### Python SDK

The Python SDK provides programmatic access to MatCraft's REST API:

\`\`\`bash
pip install matcraft-sdk
\`\`\`

\`\`\`python
from matcraft import MatCraftClient

client = MatCraftClient(api_key="mc_live_...")
campaign = client.campaigns.create(mdl_path="material.yaml")
campaign.run()
\`\`\`

See the [Python SDK Reference](/docs/api-reference/python-sdk) for full API documentation.

### Verifying Installation

Run the built-in self-check to verify everything is configured correctly:

\`\`\`bash
materia --version
materia validate --self-check
\`\`\`

Expected output:

\`\`\`
materia 1.4.0
Self-check passed:
  Core engine ........... OK
  CMA-ES optimizer ...... OK
  MLP surrogate ......... OK
  Domain plugins ........ OK (16 domains loaded)
  CLI tools ............. OK
\`\`\`

### Upgrading

To upgrade to the latest version:

\`\`\`bash
pip install --upgrade materia
\`\`\`

Check the [changelog](https://github.com/matcraft/matforge/releases) for breaking changes before upgrading major versions.

### Troubleshooting

If you encounter installation issues:

- **Dependency conflicts**: Use a clean virtual environment to avoid package version conflicts.
- **Build failures on Windows**: Install Visual C++ Build Tools from Microsoft.
- **Permission errors**: Use \`pip install --user materia\` or a virtual environment.
- See the [Troubleshooting Guide](/docs/getting-started/troubleshooting) for more solutions.
`,
};

export default page;
