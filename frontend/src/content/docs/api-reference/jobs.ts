import { DocPage } from "../index";

const page: DocPage = {
  slug: "jobs",
  title: "Jobs API",
  description: "Monitor and control background optimization jobs.",
  category: "api-reference",
  order: 2,
  lastUpdated: "2026-04-01",
  tags: ["api", "jobs", "background", "worker"],
  readingTime: 6,
  body: `
## Jobs API

Jobs represent background execution tasks for optimization campaigns. When you start a campaign, a job is created and assigned to a worker. The Jobs API allows you to monitor progress, view logs, and control execution.

### List Jobs

\`\`\`
GET /v1/jobs
\`\`\`

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| \`campaign_id\` | string | Filter by campaign |
| \`status\` | string | Filter: \`queued\`, \`running\`, \`completed\`, \`failed\`, \`cancelled\` |
| \`sort\` | string | Sort field (default: \`-created_at\`) |
| \`page\` | integer | Page number |

\`\`\`bash
curl "https://api.matcraft.io/v1/jobs?status=running" \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

**Response**:

\`\`\`json
{
  "data": [
    {
      "id": "job_xyz789",
      "campaign_id": "camp_abc123",
      "status": "running",
      "created_at": "2026-04-01T10:00:05Z",
      "started_at": "2026-04-01T10:00:06Z",
      "worker_id": "worker_01",
      "progress": {
        "iteration": 8,
        "total_iterations": 20,
        "evaluations_completed": 120,
        "budget": 300
      }
    }
  ]
}
\`\`\`

### Get Job Details

\`\`\`
GET /v1/jobs/{job_id}
\`\`\`

\`\`\`bash
curl https://api.matcraft.io/v1/jobs/job_xyz789 \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

**Response**:

\`\`\`json
{
  "data": {
    "id": "job_xyz789",
    "campaign_id": "camp_abc123",
    "status": "running",
    "created_at": "2026-04-01T10:00:05Z",
    "started_at": "2026-04-01T10:00:06Z",
    "worker_id": "worker_01",
    "progress": {
      "iteration": 8,
      "total_iterations": 20,
      "evaluations_completed": 120,
      "budget": 300,
      "current_phase": "acquiring",
      "hypervolume": 0.742,
      "best_objectives": {
        "specific_capacity": 198.3,
        "cycle_life": 1250
      }
    },
    "timing": {
      "elapsed_seconds": 342,
      "avg_iteration_seconds": 42.8,
      "estimated_remaining_seconds": 513
    }
  }
}
\`\`\`

### Get Job Logs

\`\`\`
GET /v1/jobs/{job_id}/logs
\`\`\`

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| \`level\` | string | Minimum log level: \`debug\`, \`info\`, \`warning\`, \`error\` |
| \`since\` | string | ISO timestamp to filter logs after |
| \`tail\` | integer | Return last N log entries (default: 100) |

\`\`\`bash
curl "https://api.matcraft.io/v1/jobs/job_xyz789/logs?level=info&tail=20" \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

**Response**:

\`\`\`json
{
  "data": [
    {
      "timestamp": "2026-04-01T10:05:42Z",
      "level": "info",
      "message": "[Iter 8/20] Training MLP surrogate (loss: 0.0187)"
    },
    {
      "timestamp": "2026-04-01T10:05:44Z",
      "level": "info",
      "message": "[Iter 8/20] CMA-ES acquisition: 15 candidates proposed"
    }
  ]
}
\`\`\`

### Cancel a Job

\`\`\`
POST /v1/jobs/{job_id}/cancel
\`\`\`

Cancels a queued or running job. Running jobs are stopped after the current iteration completes. Results up to that point are preserved.

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/jobs/job_xyz789/cancel \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

### Retry a Failed Job

\`\`\`
POST /v1/jobs/{job_id}/retry
\`\`\`

Creates a new job for the same campaign, resuming from the last successful iteration. Previously evaluated data is preserved and used for surrogate training.

### Job Lifecycle

\`\`\`
queued -> running -> completed
                  -> failed -> (retry) -> queued
                  -> cancelled
\`\`\`

- **queued**: Waiting for a worker to pick up the job.
- **running**: Actively executing the optimization loop.
- **completed**: Finished successfully (budget exhausted or converged).
- **failed**: An error occurred. Check logs for details.
- **cancelled**: Manually stopped by the user.

### Worker Assignment

Jobs are assigned to workers using a first-available strategy. Worker concurrency is configured via the \`WORKER_CONCURRENCY\` environment variable. Each worker can process one job at a time.

### Timeouts

Jobs have a default timeout of 24 hours. For campaigns with very large budgets or slow evaluation functions, increase the timeout:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/campaigns/camp_abc123/start \\
  -H "Authorization: Bearer mc_live_abc123" \\
  -d '{"timeout_hours": 72}'
\`\`\`
`,
};

export default page;
