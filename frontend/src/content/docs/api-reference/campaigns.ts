import { DocPage } from "../index";

const page: DocPage = {
  slug: "campaigns",
  title: "Campaigns API",
  description: "Create, manage, and query optimization campaigns via the REST API.",
  category: "api-reference",
  order: 1,
  lastUpdated: "2026-04-01",
  tags: ["api", "campaigns", "crud"],
  readingTime: 8,
  body: `
## Campaigns API

The Campaigns API provides endpoints for creating, managing, and querying materials optimization campaigns.

### Create a Campaign

\`\`\`
POST /v1/campaigns
\`\`\`

Create a new campaign from an MDL definition:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/campaigns \\
  -H "Authorization: Bearer mc_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "nmc-cathode-v2",
    "domain": "battery",
    "mdl": {
      "parameters": [
        {"name": "ni_content", "type": "continuous", "bounds": [0.5, 0.9]},
        {"name": "mn_content", "type": "continuous", "bounds": [0.05, 0.25]},
        {"name": "co_content", "type": "continuous", "bounds": [0.05, 0.25]}
      ],
      "objectives": [
        {"name": "specific_capacity", "direction": "maximize"},
        {"name": "cycle_life", "direction": "maximize"}
      ],
      "constraints": [
        {"expression": "ni_content + mn_content + co_content <= 1.0"}
      ],
      "optimizer": {"method": "cma-es", "budget": 300}
    }
  }'
\`\`\`

**Response** (\`201 Created\`):

\`\`\`json
{
  "data": {
    "id": "camp_abc123",
    "name": "nmc-cathode-v2",
    "domain": "battery",
    "status": "created",
    "created_at": "2026-04-01T10:00:00Z",
    "budget": 300,
    "evaluations_completed": 0,
    "parameters_count": 3,
    "objectives_count": 2
  }
}
\`\`\`

You can also upload an MDL file directly:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/campaigns \\
  -H "Authorization: Bearer mc_live_abc123" \\
  -F "mdl_file=@material.yaml"
\`\`\`

### List Campaigns

\`\`\`
GET /v1/campaigns
\`\`\`

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| \`status\` | string | Filter by status: \`created\`, \`running\`, \`completed\`, \`converged\`, \`failed\` |
| \`domain\` | string | Filter by domain |
| \`sort\` | string | Sort field (prefix with \`-\` for descending) |
| \`page\` | integer | Page number (default: 1) |
| \`per_page\` | integer | Items per page (default: 20, max: 100) |

\`\`\`bash
curl https://api.matcraft.io/v1/campaigns?status=running&sort=-created_at \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

### Get Campaign Details

\`\`\`
GET /v1/campaigns/{campaign_id}
\`\`\`

\`\`\`bash
curl https://api.matcraft.io/v1/campaigns/camp_abc123 \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

**Response** (\`200 OK\`):

\`\`\`json
{
  "data": {
    "id": "camp_abc123",
    "name": "nmc-cathode-v2",
    "domain": "battery",
    "status": "running",
    "created_at": "2026-04-01T10:00:00Z",
    "started_at": "2026-04-01T10:00:05Z",
    "budget": 300,
    "evaluations_completed": 120,
    "current_iteration": 8,
    "hypervolume": 0.742,
    "pareto_size": 15,
    "mdl": { ... },
    "best_objectives": {
      "specific_capacity": 198.3,
      "cycle_life": 1250
    }
  }
}
\`\`\`

### Start a Campaign

\`\`\`
POST /v1/campaigns/{campaign_id}/start
\`\`\`

Starts the optimization loop. Returns \`202 Accepted\` because the campaign runs asynchronously:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/campaigns/camp_abc123/start \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

### Stop a Campaign

\`\`\`
POST /v1/campaigns/{campaign_id}/stop
\`\`\`

Gracefully stops a running campaign after the current iteration completes. Results up to that point are preserved.

### Get Campaign Results

\`\`\`
GET /v1/campaigns/{campaign_id}/results
\`\`\`

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| \`pareto_only\` | boolean | Return only Pareto-optimal solutions (default: false) |
| \`format\` | string | Response format: \`json\` (default), \`csv\` |

\`\`\`bash
curl "https://api.matcraft.io/v1/campaigns/camp_abc123/results?pareto_only=true" \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

**Response**:

\`\`\`json
{
  "data": {
    "pareto_front": [
      {
        "id": "eval_001",
        "parameters": {"ni_content": 0.8, "mn_content": 0.1, "co_content": 0.1},
        "objectives": {"specific_capacity": 195.2, "cycle_life": 820},
        "iteration": 6,
        "is_pareto": true
      }
    ],
    "hypervolume": 0.847,
    "convergence_history": [0.12, 0.34, 0.51, 0.63, 0.71, 0.79, 0.83, 0.847]
  }
}
\`\`\`

### Delete a Campaign

\`\`\`
DELETE /v1/campaigns/{campaign_id}
\`\`\`

Permanently deletes a campaign and all associated data. This action cannot be undone.

### Campaign Lifecycle

Campaigns transition through these states:

\`\`\`
created -> running -> completed
                   -> converged
                   -> failed
\`\`\`

- **created**: MDL validated, ready to start.
- **running**: Active learning loop is executing.
- **completed**: Budget exhausted, all evaluations finished.
- **converged**: Hypervolume stagnation detected, stopped early.
- **failed**: An error occurred during execution.
`,
};

export default page;
