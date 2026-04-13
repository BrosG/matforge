import { DocPage } from "../index";

const page: DocPage = {
  slug: "overview",
  title: "API Overview",
  description: "Base URL, versioning, response format, and general conventions for the MatCraft Materials API.",
  category: "materials-api",
  order: 0,
  lastUpdated: "2026-04-10",
  tags: ["api", "overview", "rest", "json"],
  readingTime: 5,
  body: `
## API Overview

The MatCraft Materials API provides programmatic access to 205,000+ materials with their computed properties, crystal structures, electronic structure data, and builder tools.

### Base URL

All API endpoints are served from:

\`\`\`
https://api.matcraft.ai/api/v1
\`\`\`

For self-hosted deployments, replace with your instance URL (e.g., \`http://localhost:8000/api\`).

### Versioning

The API is currently at version 1 (v1). The version is implicit in the base URL. When breaking changes are introduced, a new version prefix will be added (e.g., \`/api/v2/\`). The current version will remain available for at least 12 months after a new version is released.

### Response Format

All responses are JSON. Successful responses follow this structure:

\`\`\`json
{
  "data": { ... },
  "meta": {
    "total": 1234,
    "page": 1,
    "per_page": 20,
    "took_ms": 45
  }
}
\`\`\`

For single-resource endpoints, \`data\` contains the resource object. For list endpoints, \`data\` is an array.

### Error Responses

Errors return appropriate HTTP status codes with a JSON body:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "band_gap_min must be less than band_gap_max",
    "details": { "field": "band_gap_min", "value": 5.0 }
  }
}
\`\`\`

Common status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### Content Types

- **Request**: \`Content-Type: application/json\` for POST/PUT bodies
- **Response**: Always \`application/json\` except for file export endpoints which return the appropriate MIME type

### Pagination

List endpoints support pagination via query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| \`page\` | 1 | Page number (1-indexed) |
| \`per_page\` | 20 | Items per page (max 100) |

### Rate Limits

- **Guest**: 100 requests/hour
- **Authenticated**: 1,000 requests/hour
- **Premium**: 10,000 requests/hour

Rate limit headers (\`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`) are included in every response.

### CORS

The API supports CORS for browser-based requests from any origin. No additional configuration is needed for client-side applications.
`,
};

export default page;
