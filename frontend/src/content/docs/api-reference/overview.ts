import { DocPage } from "../index";

const page: DocPage = {
  slug: "overview",
  title: "API Overview",
  description: "Introduction to the MatCraft REST API, authentication, and request conventions.",
  category: "api-reference",
  order: 0,
  lastUpdated: "2026-04-01",
  tags: ["api", "rest", "overview"],
  readingTime: 6,
  body: `
## API Overview

The MatCraft API is a RESTful service built with FastAPI that provides programmatic access to all platform features. It supports campaign management, job execution, dataset operations, and real-time progress streaming via WebSocket.

### Base URL

\`\`\`
https://api.matcraft.io/v1
\`\`\`

For self-hosted deployments:

\`\`\`
http://localhost:8000/v1
\`\`\`

### Authentication

All API requests require an API key passed in the \`Authorization\` header:

\`\`\`bash
curl -H "Authorization: Bearer mc_live_abc123..." \\
  https://api.matcraft.io/v1/campaigns
\`\`\`

See [Authentication](/docs/api-reference/authentication) for details on key management and scopes.

### Request Format

- All request bodies use JSON (\`Content-Type: application/json\`).
- Query parameters use standard URL encoding.
- File uploads use \`multipart/form-data\`.

### Response Format

All responses return JSON with a consistent envelope:

\`\`\`json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-04-01T12:00:00Z"
  }
}
\`\`\`

List endpoints include pagination metadata:

\`\`\`json
{
  "data": [ ... ],
  "meta": {
    "total": 42,
    "page": 1,
    "per_page": 20,
    "pages": 3
  }
}
\`\`\`

### HTTP Methods

| Method | Usage |
|--------|-------|
| \`GET\` | Retrieve resources |
| \`POST\` | Create resources or trigger actions |
| \`PUT\` | Replace a resource entirely |
| \`PATCH\` | Partially update a resource |
| \`DELETE\` | Remove a resource |

### Status Codes

| Code | Meaning |
|------|---------|
| \`200\` | Success |
| \`201\` | Created |
| \`202\` | Accepted (async operation started) |
| \`400\` | Bad request (validation error) |
| \`401\` | Unauthorized (missing or invalid API key) |
| \`403\` | Forbidden (insufficient permissions) |
| \`404\` | Resource not found |
| \`409\` | Conflict (e.g., duplicate campaign name) |
| \`422\` | Unprocessable entity (MDL validation failed) |
| \`429\` | Rate limit exceeded |
| \`500\` | Internal server error |

### Resource Endpoints

| Resource | Endpoint | Description |
|----------|----------|-------------|
| Campaigns | \`/v1/campaigns\` | Create, list, and manage optimization campaigns |
| Jobs | \`/v1/jobs\` | Monitor and control campaign execution jobs |
| Datasets | \`/v1/datasets\` | Upload and manage evaluation datasets |
| Templates | \`/v1/templates\` | Browse and use MDL templates |
| WebSocket | \`/v1/ws/campaigns/{id}\` | Real-time campaign progress |

### Pagination

List endpoints support pagination via query parameters:

\`\`\`
GET /v1/campaigns?page=2&per_page=10
\`\`\`

### Filtering and Sorting

\`\`\`
GET /v1/campaigns?status=running&sort=-created_at
\`\`\`

- Prefix sort fields with \`-\` for descending order.
- Multiple filters are combined with AND logic.

### SDK and Client Libraries

- **Python SDK**: \`pip install matcraft-sdk\` -- See [Python SDK](/docs/api-reference/python-sdk)
- **CLI**: The \`materia\` CLI uses the API internally for cloud operations
- **OpenAPI spec**: Available at \`/v1/openapi.json\` for generating clients in any language

### Interactive Documentation

The API provides interactive documentation via Swagger UI:

\`\`\`
https://api.matcraft.io/v1/docs
\`\`\`

And ReDoc:

\`\`\`
https://api.matcraft.io/v1/redoc
\`\`\`
`,
};

export default page;
