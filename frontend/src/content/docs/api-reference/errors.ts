import { DocPage } from "../index";

const page: DocPage = {
  slug: "errors",
  title: "Error Handling",
  description: "API error codes, response format, and handling strategies.",
  category: "api-reference",
  order: 7,
  lastUpdated: "2026-04-01",
  tags: ["api", "errors", "error-handling"],
  readingTime: 5,
  body: `
## Error Handling

The MatCraft API returns structured error responses with consistent formatting. This page documents the error response format, common error codes, and recommended handling strategies.

### Error Response Format

All errors return a JSON body with the following structure:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Parameter 'temperature' has inverted bounds [1200, 300]",
    "details": [
      {
        "path": "parameters[0].bounds",
        "message": "Lower bound must be less than upper bound",
        "value": [1200, 300]
      }
    ],
    "request_id": "req_abc123"
  }
}
\`\`\`

| Field | Type | Description |
|-------|------|-------------|
| \`code\` | string | Machine-readable error code |
| \`message\` | string | Human-readable error description |
| \`details\` | array | Optional list of specific issues |
| \`request_id\` | string | Unique identifier for debugging |

### Error Codes

#### Client Errors (4xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| \`INVALID_REQUEST\` | 400 | Malformed JSON or missing required fields |
| \`VALIDATION_FAILED\` | 422 | MDL validation errors |
| \`UNAUTHORIZED\` | 401 | Missing or invalid API key |
| \`FORBIDDEN\` | 403 | Insufficient permissions for this action |
| \`NOT_FOUND\` | 404 | Resource does not exist |
| \`CONFLICT\` | 409 | Duplicate resource (e.g., campaign name) |
| \`RATE_LIMITED\` | 429 | Too many requests |
| \`CAMPAIGN_NOT_STARTABLE\` | 400 | Campaign is not in \`created\` state |
| \`CAMPAIGN_NOT_STOPPABLE\` | 400 | Campaign is not in \`running\` state |
| \`DATASET_SCHEMA_MISMATCH\` | 422 | Dataset columns do not match MDL |

#### Server Errors (5xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| \`INTERNAL_ERROR\` | 500 | Unexpected server error |
| \`WORKER_UNAVAILABLE\` | 503 | No workers available to process jobs |
| \`EVALUATION_FAILED\` | 500 | Domain evaluation function raised an exception |
| \`SURROGATE_TRAINING_FAILED\` | 500 | Surrogate model training produced NaN or failed |

### Handling Errors in Python

\`\`\`python
from matcraft import MatCraftClient
from matcraft.exceptions import (
    ValidationError,
    NotFoundError,
    RateLimitError,
    MatCraftAPIError,
)

client = MatCraftClient()

try:
    campaign = client.campaigns.create(mdl_path="material.yaml")
    campaign.start()
except ValidationError as e:
    print(f"MDL validation failed: {e.message}")
    for detail in e.details:
        print(f"  - {detail['path']}: {detail['message']}")
except NotFoundError:
    print("Campaign or resource not found")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except MatCraftAPIError as e:
    print(f"API error {e.code}: {e.message}")
\`\`\`

### Handling Errors in JavaScript

\`\`\`javascript
try {
  const response = await fetch("/v1/campaigns", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mc_live_...",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(campaignData),
  });

  if (!response.ok) {
    const error = await response.json();
    switch (error.error.code) {
      case "VALIDATION_FAILED":
        console.error("Fix MDL:", error.error.details);
        break;
      case "RATE_LIMITED":
        const retryAfter = response.headers.get("Retry-After");
        console.log(\`Retry in \${retryAfter}s\`);
        break;
      default:
        console.error(\`Error: \${error.error.message}\`);
    }
  }
} catch (networkError) {
  console.error("Network error:", networkError);
}
\`\`\`

### Retry Strategy

For transient errors (5xx, 429), implement exponential backoff:

1. Wait 1 second, then retry.
2. If still failing, wait 2 seconds, then retry.
3. Continue doubling the wait time up to a maximum of 60 seconds.
4. After 5 retries, give up and report the error.

The \`Retry-After\` header (present on 429 responses) indicates the minimum wait time before retrying.

### Request IDs

Every API response includes a \`request_id\` in the error body and in the \`X-Request-ID\` response header. Include this ID when contacting support for faster debugging.
`,
};

export default page;
