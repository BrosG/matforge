import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "system-architecture",
    question: "What is MatCraft's system architecture?",
    answer: `MatCraft follows a modern, layered architecture with clear separation between the frontend, backend API, task processing, and core optimization engine.

## Architecture Overview

\`\`\`
┌──────────────────┐     ┌──────────────────┐
│   Next.js        │     │   Python SDK /   │
│   Frontend       │     │   CLI            │
│   (Port 3000)    │     │                  │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │  REST / WebSocket      │  REST
         │                        │
         ▼                        ▼
┌──────────────────────────────────────────┐
│          FastAPI Backend (Port 8000)      │
│  ┌────────┐ ┌────────┐ ┌──────────────┐ │
│  │ Routes │ │ Auth   │ │ WebSocket    │ │
│  │        │ │ (JWT)  │ │ Manager      │ │
│  └────────┘ └────────┘ └──────────────┘ │
└────────────────┬─────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │
│  (Data)      │  │  (Queue +    │
│              │  │   Pub/Sub)   │
└──────────────┘  └──────┬───────┘
                         │
                         ▼
                 ┌──────────────┐
                 │   Celery     │
                 │   Workers    │
                 │  ┌────────┐  │
                 │  │materia │  │
                 │  │ core   │  │
                 │  └────────┘  │
                 └──────────────┘
\`\`\`

## Component Details

### Frontend (Next.js 14)

- **Framework**: Next.js with App Router and React Server Components.
- **Styling**: Tailwind CSS with shadcn/ui component library.
- **State management**: Zustand for client state, React Query for server state.
- **Real-time**: WebSocket connection for live campaign progress updates.
- **Visualization**: Recharts for convergence plots, Plotly.js for interactive 3D Pareto surfaces.

### Backend (FastAPI)

- **Framework**: FastAPI with async request handling.
- **Authentication**: JWT tokens with refresh rotation. OAuth2 support for GitHub/Google.
- **Database ORM**: SQLAlchemy 2.0 with async session management.
- **API documentation**: Auto-generated OpenAPI/Swagger at \`/docs\`.
- **WebSocket**: Real-time campaign updates pushed to connected clients.

### Task Queue (Celery + Redis)

- **Broker**: Redis serves as both the message broker and result backend.
- **Workers**: Celery workers execute long-running tasks: surrogate training, CMA-ES optimization, and active learning iterations.
- **Concurrency**: Each worker runs multiple threads/processes depending on whether the task is CPU-bound (optimization) or I/O-bound (data import).

### Core Library (materia)

- **Location**: \`src/materia/\`
- **Pure Python**: No web framework dependencies. Can be used standalone.
- **Key modules**: \`surrogate/\` (MLP, ONNX), \`optimize/\` (CMA-ES), \`active_learning/\` (acquisition functions, convergence), \`analysis/\` (Pareto computation), \`plugins/\` (domain definitions).

### Database (PostgreSQL)

- **Schema**: Normalized schema with tables for organizations, users, materials, campaigns, iterations, candidates, and measurements.
- **Migrations**: Managed with Alembic. Run \`materia db upgrade\` to apply.

This architecture ensures that the compute-intensive optimization runs asynchronously without blocking the API, while the frontend receives real-time updates via WebSocket.`,
    category: "technical",
    order: 0,
    relatedSlugs: ["database-requirements", "celery-task-queue"],
    tags: ["architecture", "system-design", "overview"],
  },
  {
    slug: "database-requirements",
    question: "What are the database requirements?",
    answer: `MatCraft uses PostgreSQL as its primary data store. Here are the requirements, configuration recommendations, and scaling considerations.

## Minimum Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| PostgreSQL version | 14 | 16 |
| Storage | 1 GB | 10 GB+ |
| RAM | 256 MB (shared) | 1 GB+ dedicated |
| Connections | 20 | 100+ |

## Local Development

For local development, the simplest setup is Docker:

\`\`\`bash
docker run -d \\
  --name matcraft-db \\
  -e POSTGRES_DB=matcraft \\
  -e POSTGRES_USER=matcraft \\
  -e POSTGRES_PASSWORD=matcraft \\
  -p 5432:5432 \\
  -v matcraft-pgdata:/var/lib/postgresql/data \\
  postgres:16-alpine
\`\`\`

Alternatively, the core library can use **SQLite** for single-user, local-only usage (no web dashboard):

\`\`\`bash
# SQLite mode (core library only, no server)
export MATCRAFT_DATABASE_URL="sqlite:///./matcraft.db"
materia campaign run --config my_material.yaml
\`\`\`

## Connection String

Configure the database URL in your \`.env\` file:

\`\`\`
DATABASE_URL=postgresql://user:password@host:5432/matcraft
\`\`\`

For connection pooling in production, use PgBouncer or your cloud provider's built-in connection pooler:

\`\`\`
DATABASE_URL=postgresql://user:password@pgbouncer:6432/matcraft?pgbouncer=true
\`\`\`

## Schema Management

MatCraft uses Alembic for database migrations:

\`\`\`bash
# Apply all pending migrations
materia db upgrade

# Check current migration version
materia db current

# Generate a new migration after model changes (development)
materia db revision --autogenerate -m "add campaign tags"
\`\`\`

## Key Tables

| Table | Purpose | Growth Rate |
|-------|---------|-------------|
| \`materials\` | Material definitions | Slow (10s-100s) |
| \`campaigns\` | Campaign metadata | Slow (10s-100s) |
| \`iterations\` | Per-iteration state | Moderate (100s-1000s) |
| \`candidates\` | Proposed compositions | Fast (1000s-10000s) |
| \`measurements\` | Evaluation results | Fast (1000s-10000s) |
| \`surrogate_checkpoints\` | Serialized model weights | Moderate (MBs per checkpoint) |

## Production Recommendations

- **Backups**: Enable automated daily backups with point-in-time recovery. For AWS RDS, this is enabled by default.
- **Monitoring**: Track connection pool usage, query latency (p95), and disk usage. Alert when connections exceed 80% of the pool or disk usage exceeds 80%.
- **Indexing**: MatCraft creates necessary indexes during migration. For very large deployments (>100k candidates), consider adding partial indexes on the \`candidates\` table for active campaigns.
- **Vacuuming**: Ensure autovacuum is enabled (it is by default in PostgreSQL). The \`candidates\` table sees frequent inserts and benefits from regular vacuuming.

## Managed Database Services

Tested and recommended managed PostgreSQL services:

- **AWS RDS**: Use \`db.t3.medium\` for small teams, \`db.r6g.large\` for production.
- **Google Cloud SQL**: Standard tier with 1+ vCPU.
- **Azure Database for PostgreSQL**: Flexible Server, General Purpose tier.
- **Supabase**: Works well for small deployments.`,
    category: "technical",
    order: 1,
    relatedSlugs: ["system-architecture", "how-to-run-locally"],
    tags: ["database", "postgresql", "storage"],
  },
  {
    slug: "websocket-real-time",
    question: "How does real-time campaign monitoring work?",
    answer: `MatCraft uses WebSocket connections to push real-time updates from running campaigns to the dashboard and connected clients. This eliminates the need for polling and provides an instant, reactive experience.

## How It Works

1. When you open a campaign page in the dashboard, the frontend establishes a WebSocket connection to the backend at \`/ws/campaigns/{campaign_id}\`.
2. The backend subscribes to a Redis Pub/Sub channel for that campaign.
3. As the Celery worker progresses through optimization iterations, it publishes events to the Redis channel.
4. The backend forwards these events to all connected WebSocket clients.

## Event Types

\`\`\`typescript
type CampaignEvent =
  | { type: "iteration_started"; iteration: number; timestamp: string }
  | { type: "surrogate_trained"; metrics: { train_loss: number; val_loss: number } }
  | { type: "candidates_proposed"; candidates: Candidate[]; iteration: number }
  | { type: "candidates_evaluated"; results: EvaluationResult[]; iteration: number }
  | { type: "iteration_completed"; iteration: number; best_value: number; pareto_size: number }
  | { type: "campaign_completed"; total_iterations: number; total_evaluations: number }
  | { type: "campaign_error"; error: string; iteration: number }
  | { type: "convergence_update"; metric: number; converged: boolean };
\`\`\`

## Frontend Integration

The dashboard uses these events to update visualizations in real-time:

- **Convergence plot**: New data points appear as each iteration completes.
- **Pareto plot**: The Pareto front is redrawn as new candidates are evaluated.
- **Candidate table**: New candidates appear with their predicted and (once evaluated) actual objective values.
- **Progress indicator**: Shows the current iteration, elapsed time, and estimated time remaining.

## Python SDK Streaming

You can also stream events in the Python SDK:

\`\`\`python
from materia import Client

client = Client(base_url="https://api.matcraft.io", token="mc_live_...")

for event in client.campaigns.stream("camp-123"):
    if event.type == "iteration_completed":
        print(f"Iteration {event.iteration}: best = {event.best_value:.4f}")
    elif event.type == "campaign_completed":
        print(f"Done! {event.total_iterations} iterations, {event.total_evaluations} evaluations")
        break
\`\`\`

## CLI Live Output

The CLI shows real-time progress when running a campaign:

\`\`\`
$ materia campaign run --config my_material.yaml
[Iter  1/20] Training surrogate... done (0.8s, val_loss=0.0342)
[Iter  1/20] Optimizing acquisition... done (1.2s, 5 candidates)
[Iter  1/20] Evaluating candidates... done (0.3s)
[Iter  1/20] Best: water_flux=42.3, salt_rejection=93.1%
[Iter  2/20] Training surrogate... done (0.9s, val_loss=0.0215)
...
\`\`\`

## Scaling WebSockets

For high-concurrency deployments with many simultaneous dashboard users:

- The FastAPI backend uses async WebSocket handlers, supporting thousands of concurrent connections per process.
- Redis Pub/Sub handles cross-process message distribution when running multiple API server instances behind a load balancer.
- WebSocket connections are authenticated with the same JWT token used for REST API calls.`,
    category: "technical",
    order: 2,
    relatedSlugs: ["system-architecture", "celery-task-queue"],
    tags: ["websocket", "real-time", "streaming"],
  },
  {
    slug: "celery-task-queue",
    question: "How does the Celery task queue work?",
    answer: `MatCraft uses Celery with Redis as the message broker to run optimization tasks asynchronously. This architecture keeps the API responsive while computationally intensive surrogate training and optimization run in the background.

## Why Celery?

Materials optimization involves CPU-intensive tasks that can take seconds to minutes per iteration:

- **Surrogate training**: Training an MLP on hundreds to thousands of data points (1-30 seconds depending on architecture and dataset size).
- **CMA-ES optimization**: Running hundreds of generations to optimize the acquisition function (1-10 seconds).
- **Evaluation**: Running physics models or external simulations (seconds to hours).

Running these in the API request-response cycle would cause timeouts. Celery offloads them to dedicated worker processes.

## Task Flow

\`\`\`
API Server                    Redis                     Celery Worker
    │                           │                           │
    │  POST /campaigns/run      │                           │
    │──────────────────────────>│                           │
    │  task_id = "abc-123"      │                           │
    │<──────────────────────────│                           │
    │                           │  pick up task             │
    │                           │──────────────────────────>│
    │                           │                           │ Train surrogate
    │                           │  publish progress event   │
    │                           │<──────────────────────────│
    │  WebSocket push to client │                           │
    │<──────────────────────────│                           │
    │                           │                           │ Run CMA-ES
    │                           │  publish progress event   │
    │                           │<──────────────────────────│
    │  WebSocket push to client │                           │
    │<──────────────────────────│                           │
    │                           │  task complete            │
    │                           │<──────────────────────────│
\`\`\`

## Configuration

Worker configuration in your \`.env\` or Celery config:

\`\`\`python
# celery_config.py
broker_url = "redis://localhost:6379/0"
result_backend = "redis://localhost:6379/1"
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]
task_time_limit = 3600        # Hard limit: 1 hour per task
task_soft_time_limit = 3000   # Soft limit: 50 minutes (raises exception)
worker_prefetch_multiplier = 1  # One task at a time per worker process
worker_concurrency = 4         # 4 parallel worker processes
\`\`\`

## Running Workers

\`\`\`bash
# Single worker with 4 processes
celery -A materia.tasks worker --loglevel=info --concurrency=4

# GPU worker for surrogate training (single process, GPU-bound)
celery -A materia.tasks worker --loglevel=info --concurrency=1 \\
  --queues=gpu_training -n gpu-worker@%h

# Priority queues
celery -A materia.tasks worker --loglevel=info \\
  --queues=high_priority,default,low_priority
\`\`\`

## Task Types

| Task | Queue | Typical Duration | Priority |
|------|-------|-----------------|----------|
| \`train_surrogate\` | default (or gpu_training) | 1-30s | High |
| \`run_cmaes_optimization\` | default | 1-10s | High |
| \`evaluate_candidates\` | default | 0.1s - 1h | Medium |
| \`compute_pareto_front\` | default | 0.1-5s | Low |
| \`export_results\` | low_priority | 1-60s | Low |
| \`cleanup_old_checkpoints\` | low_priority | 1-10s | Low |

## Monitoring

Use Flower for a web-based Celery monitoring dashboard:

\`\`\`bash
pip install flower
celery -A materia.tasks flower --port=5555
\`\`\`

This provides real-time visibility into task queues, worker status, task history, and performance metrics at \`http://localhost:5555\`.

## Scaling Workers

Add more workers to handle higher campaign throughput:

\`\`\`bash
# Run 3 worker instances
docker compose up -d --scale worker=3
\`\`\`

Each worker independently pulls tasks from Redis, so scaling is straightforward. The only shared state is the PostgreSQL database.`,
    category: "technical",
    order: 3,
    relatedSlugs: ["system-architecture", "websocket-real-time"],
    tags: ["celery", "redis", "task-queue", "async"],
  },
  {
    slug: "cloud-deployment-guide",
    question: "What are the best practices for cloud deployment?",
    answer: `Deploying MatCraft to production requires attention to security, reliability, and performance. Here is a comprehensive guide covering the most important considerations.

## Infrastructure Sizing

### Small Team (1-5 users, <10 concurrent campaigns)

| Component | Specification |
|-----------|--------------|
| API Server | 1 instance, 2 vCPU, 4 GB RAM |
| Workers | 2 instances, 2 vCPU, 4 GB RAM each |
| Database | Managed PostgreSQL, 2 vCPU, 4 GB RAM, 50 GB storage |
| Redis | Managed Redis, 1 GB RAM |
| Estimated cost | $200-400/month (AWS) |

### Medium Team (5-20 users, 10-50 concurrent campaigns)

| Component | Specification |
|-----------|--------------|
| API Server | 2 instances behind ALB, 2 vCPU, 8 GB RAM each |
| Workers | 4-8 instances, 4 vCPU, 8 GB RAM each |
| Database | Managed PostgreSQL, 4 vCPU, 16 GB RAM, 200 GB storage, read replica |
| Redis | Managed Redis, 2 GB RAM, cluster mode |
| Estimated cost | $800-1,500/month (AWS) |

## Security Checklist

- [ ] **TLS everywhere**: Use ACM (AWS) or Let's Encrypt for TLS certificates. Enforce HTTPS redirection.
- [ ] **Strong secrets**: Generate a cryptographically random \`SECRET_KEY\` (at least 32 bytes). Never reuse across environments.
- [ ] **Database credentials**: Store in AWS Secrets Manager, not environment variables or config files.
- [ ] **Network isolation**: Place the database and Redis in a private subnet. Only the API server should have direct access.
- [ ] **WAF**: Enable AWS WAF or Cloudflare in front of the API to block common attacks.
- [ ] **CORS**: Configure allowed origins to match your frontend domain only.
- [ ] **Rate limiting**: The API has built-in rate limiting, but consider adding an external rate limiter at the load balancer level for DDoS protection.

## Environment Variables

\`\`\`bash
# Required
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/matcraft
REDIS_URL=redis://elasticache-endpoint:6379/0
SECRET_KEY=<cryptographically-random-32-byte-hex-string>
MATCRAFT_ENV=production

# Optional
CORS_ORIGINS=https://matcraft.yourcompany.com
LOG_LEVEL=info
SENTRY_DSN=https://abc@sentry.io/123   # Error tracking
\`\`\`

## Health Checks

Configure your load balancer to check these endpoints:

- **API**: \`GET /health\` -- returns 200 if the API is running and the database is reachable.
- **Worker**: Celery workers report health via the \`celery inspect ping\` command. Set up a sidecar that exposes this as an HTTP endpoint.

## Backup Strategy

- **Database**: Automated daily snapshots with 7-day retention. Enable point-in-time recovery (PITR) for granular restoration.
- **Redis**: Redis data is ephemeral (task queue). No backups needed -- tasks will be re-queued if Redis restarts.
- **Surrogate checkpoints**: Stored in the database. Covered by database backups.

## Monitoring and Alerting

Set up alerts for:

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|--------------------|
| API error rate (5xx) | >1% | >5% |
| API latency (p95) | >500ms | >2000ms |
| Worker queue depth | >50 tasks | >200 tasks |
| Database connections | >80% pool | >95% pool |
| Database disk usage | >70% | >85% |
| Redis memory | >70% | >85% |

Use CloudWatch (AWS), Prometheus + Grafana (self-managed), or Datadog for monitoring.`,
    category: "technical",
    order: 4,
    relatedSlugs: ["how-to-deploy-cloud", "scaling-campaigns", "system-architecture"],
    tags: ["deployment", "cloud", "production", "security"],
  },
  {
    slug: "scaling-campaigns",
    question: "How do I scale MatCraft for large workloads?",
    answer: `MatCraft is designed to scale horizontally. Here is how to handle increasing numbers of users, campaigns, and evaluations.

## Scaling the API Layer

The FastAPI backend is stateless -- all session state is stored in the database and Redis. To handle more concurrent users:

\`\`\`bash
# Scale API instances behind a load balancer
docker compose up -d --scale api=4
\`\`\`

Each API instance can handle approximately 500 concurrent connections (including WebSocket). For 100 concurrent dashboard users, 2-3 instances are sufficient.

**Key considerations:**

- Use sticky sessions (session affinity) at the load balancer for WebSocket connections.
- All instances share the same database and Redis, so no state synchronization is needed.

## Scaling Workers

Workers are the primary bottleneck for campaign throughput. Each worker process handles one task at a time:

\`\`\`bash
# Scale horizontally (more worker containers)
docker compose up -d --scale worker=8

# Scale vertically (more processes per worker)
celery -A materia.tasks worker --concurrency=8
\`\`\`

**Rules of thumb:**

- Each campaign iteration requires 1 worker process for 2-30 seconds.
- For N concurrent campaigns running simultaneously, you need approximately N/2 worker processes (since campaigns spend time waiting between iterations).
- CPU-bound tasks (CMA-ES, surrogate training): Set concurrency equal to the number of CPU cores.
- GPU-bound tasks (large surrogate training): Set concurrency to 1 per GPU.

## Priority Queues

For mixed workloads, use priority queues to ensure interactive requests are not blocked by batch jobs:

\`\`\`python
# In task definitions
@app.task(queue="high_priority")
def train_surrogate(campaign_id: str):
    ...

@app.task(queue="low_priority")
def export_results(campaign_id: str):
    ...
\`\`\`

\`\`\`bash
# Dedicated workers per queue
celery -A materia.tasks worker --queues=high_priority --concurrency=4
celery -A materia.tasks worker --queues=low_priority --concurrency=2
\`\`\`

## Scaling the Database

PostgreSQL is typically the last bottleneck. Strategies for scaling:

1. **Connection pooling**: Use PgBouncer between the application and PostgreSQL. This reduces the number of direct database connections from (API instances * worker processes * connections per process) to a manageable pool.

2. **Read replicas**: Route read-heavy dashboard queries (listing campaigns, viewing results) to a read replica. Write operations (creating candidates, storing measurements) go to the primary.

3. **Partitioning**: For very large deployments (>1M candidates), partition the \`candidates\` table by campaign ID:

\`\`\`sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL,
    ...
) PARTITION BY HASH (campaign_id);
\`\`\`

## Auto-Scaling

On Kubernetes or ECS, configure horizontal pod auto-scaling based on:

- **API pods**: Scale on CPU utilization (target: 60%) or request rate.
- **Worker pods**: Scale on Redis queue depth (target: <10 pending tasks per worker).

\`\`\`yaml
# Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: matcraft-worker
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: matcraft-worker
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: External
      external:
        metric:
          name: redis_queue_depth
        target:
          type: AverageValue
          averageValue: "10"
\`\`\``,
    category: "technical",
    order: 5,
    relatedSlugs: ["system-architecture", "celery-task-queue", "cloud-deployment-guide"],
    tags: ["scaling", "performance", "kubernetes"],
  },
  {
    slug: "gpu-acceleration",
    question: "Does MatCraft support GPU acceleration?",
    answer: `Yes. MatCraft supports GPU acceleration for surrogate model training, which can provide a 5-20x speedup for large datasets and complex model architectures.

## When GPU Helps

GPU acceleration is most beneficial when:

- **Large datasets**: More than 1,000 training points. For smaller datasets, the overhead of moving data to GPU memory outweighs the computation benefit.
- **Large models**: Hidden layers with 256+ neurons or 3+ layers. Small models (64-64) train fast enough on CPU.
- **Frequent retraining**: Active learning campaigns retrain the surrogate every iteration. Faster training means faster campaign completion.
- **Ensemble surrogates**: Training 5-10 independent models benefits significantly from GPU parallelism.

## Installation

Install the GPU-enabled version:

\`\`\`bash
pip install matcraft[gpu]
\`\`\`

This installs PyTorch with CUDA support. Verify GPU availability:

\`\`\`python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0)}")
\`\`\`

## Configuration

Enable GPU training in your campaign config:

\`\`\`yaml
surrogate:
  type: mlp
  device: cuda        # "cpu" or "cuda" (default: auto-detect)
  hidden_layers: [256, 256, 128]
  epochs: 500
  batch_size: 256     # Larger batch sizes benefit more from GPU
\`\`\`

Or in Python:

\`\`\`python
from materia.surrogate import MLPSurrogate

surrogate = MLPSurrogate(
    hidden_layers=[256, 256, 128],
    device="cuda",
    batch_size=256,
)
\`\`\`

## Docker with GPU

Use the NVIDIA Container Toolkit:

\`\`\`bash
# Install NVIDIA Container Toolkit
# (See: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)

# Run with GPU support
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
\`\`\`

The GPU compose override:

\`\`\`yaml
# docker-compose.gpu.yml
services:
  worker:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      MATCRAFT_DEVICE: cuda
\`\`\`

## Supported GPUs

| GPU | Status | Notes |
|-----|--------|-------|
| NVIDIA A100 | Fully supported | Best performance, recommended for production |
| NVIDIA V100 | Fully supported | Good performance |
| NVIDIA T4 | Fully supported | Cost-effective for cloud (AWS g4dn instances) |
| NVIDIA RTX 3090/4090 | Supported | Good for local development |
| NVIDIA RTX 3060/4060 | Supported | Adequate for small to medium models |
| AMD GPUs (ROCm) | Experimental | Requires PyTorch ROCm build |
| Apple M1/M2/M3 (MPS) | Experimental | Use \`device: mps\` |

## Performance Benchmarks

Training time for an MLP surrogate with \`[256, 256, 128]\` architecture, 200 epochs:

| Dataset Size | CPU (i7-12700) | GPU (RTX 3090) | Speedup |
|-------------|----------------|----------------|---------|
| 100 points | 2.1s | 1.8s | 1.2x |
| 1,000 points | 8.3s | 1.9s | 4.4x |
| 10,000 points | 45.2s | 3.1s | 14.6x |
| 100,000 points | 412s | 21.4s | 19.3x |

For typical active learning campaigns with <1,000 data points, CPU training is fast enough. GPU becomes valuable for large-scale campaigns or when running many campaigns concurrently.

## Cloud GPU Instances

Recommended cloud instances for GPU workers:

- **AWS**: \`g4dn.xlarge\` (T4, $0.52/hr) for cost-effective training
- **GCP**: \`n1-standard-4\` with T4 ($0.35/hr + $0.35/hr GPU)
- **Azure**: \`Standard_NC4as_T4_v3\` (T4, $0.53/hr)`,
    category: "technical",
    order: 6,
    relatedSlugs: ["how-surrogate-models-work", "scaling-campaigns"],
    tags: ["gpu", "cuda", "performance", "hardware"],
  },
  {
    slug: "contributing-guide",
    question: "How can I contribute to MatCraft?",
    answer: `We welcome contributions to the MatCraft open-source core. Whether you are fixing a bug, adding a domain plugin, improving documentation, or implementing a new feature, here is how to get started.

## Getting Set Up

\`\`\`bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/matcraft.git
cd matcraft

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install in development mode with all extras
pip install -e ".[dev,test,docs]"

# Install pre-commit hooks
pre-commit install

# Verify everything works
pytest
\`\`\`

## Development Workflow

1. **Create a branch** from \`main\`:
   \`\`\`bash
   git checkout -b feature/my-new-feature
   \`\`\`

2. **Make your changes** with tests. We maintain >90% test coverage.

3. **Run the test suite**:
   \`\`\`bash
   # Run all tests
   pytest

   # Run specific test file
   pytest tests/test_surrogate_mlp.py

   # Run with coverage
   pytest --cov=materia --cov-report=html
   \`\`\`

4. **Run linting and formatting**:
   \`\`\`bash
   # These run automatically via pre-commit hooks
   ruff check src/ tests/
   ruff format src/ tests/
   mypy src/materia/
   \`\`\`

5. **Submit a pull request** against \`main\` with a clear description of your changes.

## Contribution Areas

### Domain Plugins (Most Welcome)

Adding new material domain plugins is one of the most impactful contributions. A domain plugin consists of:

- A \`components.yaml\` file defining the parameter schema
- A \`physics.py\` file with approximate evaluation models
- Tests in \`tests/test_plugin_<domain>.py\`
- Documentation in \`docs/domains/<domain>.md\`

See \`src/materia/plugins/water/\` for a complete example.

### Surrogate Models

We are interested in alternative surrogate architectures:

- Gaussian Process surrogates
- Graph Neural Network surrogates (for crystal structures)
- Ensemble methods
- Transfer learning across domains

### Optimization Algorithms

Beyond CMA-ES, we would welcome implementations of:

- Differential Evolution
- Particle Swarm Optimization
- Multi-objective evolutionary algorithms (NSGA-II, MOEA/D)

### Bug Fixes and Improvements

Check the [GitHub Issues](https://github.com/matcraft/matcraft/issues) page for open bugs and feature requests labeled \`good-first-issue\` or \`help-wanted\`.

## Code Style

- Python code follows PEP 8, enforced by Ruff.
- Type hints are required for all public APIs.
- Docstrings follow the NumPy style.
- Tests use pytest with fixtures defined in \`conftest.py\`.

## Contributor License Agreement

All contributors must sign a CLA before their first pull request can be merged. The CLA bot will automatically comment on your PR with instructions. The CLA allows us to distribute your contributions under the Apache 2.0 license.

## Recognition

All contributors are listed in the CONTRIBUTORS.md file and acknowledged in release notes. Significant contributors may be invited to join the core maintainer team.`,
    category: "technical",
    order: 7,
    relatedSlugs: ["is-matcraft-open-source", "community-support"],
    tags: ["contributing", "development", "open-source"],
  },
];

export default faqs;
