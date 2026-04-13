import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "api-rate-limits",
    question: "What are the API rate limits?",
    answer: `MatCraft enforces rate limits to ensure fair access for all users:

| Tier | Limit | Authentication |
|------|-------|---------------|
| Guest | 100 requests/hour | None required |
| Free account | 1,000 requests/hour | JWT token |
| Premium | 10,000 requests/hour | JWT token |
| Enterprise | Custom | JWT token + API key |

Rate limit information is included in every API response via headers:

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1713024000
\`\`\`

When you exceed the limit, the API returns HTTP 429 (Too Many Requests) with a \`Retry-After\` header indicating how many seconds to wait.`,
    category: "api",
    order: 0,
    relatedSlugs: ["api-authentication", "api-pricing"],
    tags: ["api", "rate-limits", "throttling"],
  },
  {
    slug: "api-authentication",
    question: "How do I authenticate with the API?",
    answer: `Most read-only endpoints work without authentication (guest access). For higher rate limits and builder tools, you need a JWT token.

## Getting a Token

1. Create an account at matcraft.io (Google, GitHub, or ORCID sign-in)
2. Go to Settings > API Keys
3. Click "Generate New Token"
4. Copy the token immediately (shown only once)

## Using the Token

Include it in the Authorization header:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" "https://matcraft.io/api/materials"
\`\`\`

Or with the Python SDK:

\`\`\`python
from matcraft import MatCraftClient
client = MatCraftClient(token="YOUR_TOKEN")
\`\`\`

Tokens expire after 30 days by default. Use the refresh endpoint to get a new token before expiry.`,
    category: "api",
    order: 1,
    relatedSlugs: ["api-rate-limits", "api-python-sdk"],
    tags: ["api", "authentication", "jwt", "token"],
  },
  {
    slug: "api-python-sdk",
    question: "Is there a Python SDK for the API?",
    answer: `Yes, the MatCraft Python SDK provides a high-level interface to the API:

\`\`\`bash
pip install matcraft
\`\`\`

\`\`\`python
from matcraft import MatCraftClient

client = MatCraftClient()  # guest access
# or
client = MatCraftClient(token="YOUR_TOKEN")  # authenticated

# Search
results = client.search(elements=["Si", "O"], band_gap_min=1.0)

# Get detail
material = client.get_material("mp-149")

# Export structure
material.export("poscar", path="output.vasp")

# Band structure
bs = client.get_band_structure("mp-149")
bs.plot()  # matplotlib

# Builder tools (requires auth)
supercell = client.build_supercell("mp-149", nx=2, ny=2, nz=2)
\`\`\`

The SDK handles pagination, error handling, and rate limit retries automatically. Full documentation is at [docs.matcraft.io/sdk](https://docs.matcraft.io/sdk).`,
    category: "api",
    order: 2,
    relatedSlugs: ["api-authentication", "api-rate-limits"],
    tags: ["api", "python", "sdk"],
  },
  {
    slug: "api-javascript-sdk",
    question: "Is there a JavaScript or TypeScript SDK?",
    answer: `There is no official JavaScript/TypeScript SDK yet. However, the REST API is straightforward to use with \`fetch\` or any HTTP client:

\`\`\`typescript
const response = await fetch(
  "https://matcraft.io/api/materials?search=Si&per_page=10"
);
const { data, meta } = await response.json();

for (const material of data) {
  console.log(\`\${material.formula}: Eg = \${material.band_gap} eV\`);
}
\`\`\`

The API returns standard JSON responses, so any language with HTTP support can integrate with MatCraft. A TypeScript SDK is on our roadmap based on community demand.`,
    category: "api",
    order: 3,
    relatedSlugs: ["api-python-sdk"],
    tags: ["api", "javascript", "typescript"],
  },
  {
    slug: "api-cors",
    question: "Can I call the API from a browser (CORS)?",
    answer: `Yes, the MatCraft API supports CORS (Cross-Origin Resource Sharing) from any origin. You can make API calls directly from client-side JavaScript without a proxy server.

\`\`\`javascript
// Works from any website
const resp = await fetch("https://matcraft.io/api/materials/mp-149");
const data = await resp.json();
\`\`\`

CORS headers returned:

\`\`\`
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
\`\`\`

Note that browser-based requests are still subject to rate limits based on the client IP address.`,
    category: "api",
    order: 4,
    relatedSlugs: ["api-rate-limits"],
    tags: ["api", "cors", "browser"],
  },
  {
    slug: "api-pagination",
    question: "How does API pagination work?",
    answer: `List endpoints return paginated results. Use the \`page\` and \`per_page\` query parameters:

\`\`\`bash
# Page 1 (default), 20 items
curl "https://matcraft.io/api/materials?elements=O&per_page=20&page=1"

# Page 2
curl "https://matcraft.io/api/materials?elements=O&per_page=20&page=2"
\`\`\`

The response includes a \`meta\` object with pagination info:

\`\`\`json
{
  "meta": {
    "total": 85432,
    "page": 1,
    "per_page": 20,
    "took_ms": 45
  }
}
\`\`\`

- Maximum \`per_page\` value is 100
- Pages are 1-indexed
- \`total\` gives the full count of matching materials

For iterating through all results, loop through pages until \`page * per_page >= total\`.`,
    category: "api",
    order: 5,
    relatedSlugs: ["api-rate-limits"],
    tags: ["api", "pagination", "paging"],
  },
  {
    slug: "api-error-handling",
    question: "How should I handle API errors?",
    answer: `The API returns standard HTTP status codes with JSON error bodies:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "band_gap_min must be a positive number",
    "details": { "field": "band_gap_min", "value": -1 }
  }
}
\`\`\`

## Common Error Codes

| HTTP Status | Error Code | Meaning |
|-------------|-----------|---------|
| 400 | VALIDATION_ERROR | Invalid parameter value |
| 401 | UNAUTHORIZED | Missing or invalid auth token |
| 404 | NOT_FOUND | Material or resource not found |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error (please report) |

## Best Practices

- Check the HTTP status code before parsing the response body
- For 429 errors, read the \`Retry-After\` header and wait before retrying
- For 500 errors, retry with exponential backoff (max 3 retries)
- Log the full error response for debugging`,
    category: "api",
    order: 6,
    relatedSlugs: ["api-rate-limits", "api-authentication"],
    tags: ["api", "errors", "handling"],
  },
  {
    slug: "api-bulk-download",
    question: "Can I download the entire materials database?",
    answer: `MatCraft does not currently offer a full database dump download. For large-scale data access, we recommend:

1. **Paginated API queries**: Use the search endpoint with broad filters and iterate through all pages. With 100 items per page, you can retrieve the full database in about 2,050 requests.

2. **Upstream sources**: For the raw data, download directly from:
   - Materials Project: [materialsproject.org/api](https://materialsproject.org/api)
   - AFLOW: [aflowlib.org/API](http://aflowlib.org)
   - JARVIS: [jarvis.nist.gov](https://jarvis.nist.gov)

3. **Filtered exports**: Use specific search criteria to download only the materials relevant to your research, which is typically a small fraction of the full database.

For enterprise users with bulk data needs, contact us for custom data export arrangements.`,
    category: "api",
    order: 7,
    relatedSlugs: ["api-pagination", "api-rate-limits"],
    tags: ["api", "bulk", "download", "export"],
  },
  {
    slug: "api-versioning",
    question: "How does API versioning work?",
    answer: `The current API is version 1, which is implicit in the base URL (\`/api/...\`). When we introduce breaking changes, a new version will be created:

- Current: \`https://matcraft.io/api/materials\`
- Future v2: \`https://matcraft.io/api/v2/materials\`

## Compatibility Promise

- The current version (v1) will remain available for at least 12 months after a new version is released
- Non-breaking changes (new fields, new endpoints) may be added to v1 without version bump
- Breaking changes (removed fields, changed response structure) always go to a new version

## What Counts as Breaking

- Removing a response field
- Changing a field's type (string to number)
- Changing the structure of the response envelope
- Removing an endpoint

## What Is Not Breaking

- Adding new optional query parameters
- Adding new fields to response objects
- Adding new endpoints
- Adding new enum values to existing fields`,
    category: "api",
    order: 8,
    relatedSlugs: ["api-rate-limits"],
    tags: ["api", "versioning", "compatibility"],
  },
  {
    slug: "api-self-hosted",
    question: "Can I run the API on my own server?",
    answer: `Yes, MatCraft is available for self-hosted deployment. The full stack includes:

- **FastAPI backend**: Python REST API server
- **PostgreSQL database**: Stores all materials data
- **Next.js frontend**: Web dashboard
- **Redis** (optional): For caching and task queuing

## Quick Start

\`\`\`bash
git clone https://github.com/matcraft/matcraft
cd matcraft
docker-compose up
\`\`\`

This starts all services and loads the database. The API is then available at \`http://localhost:8000/api\`.

## Benefits of Self-Hosting

- Complete data privacy (no data leaves your network)
- No rate limits
- Custom data integration
- Full control over updates and configuration

See the [Installation Guide](/docs/getting-started/installation) for detailed self-hosting instructions.`,
    category: "api",
    order: 9,
    relatedSlugs: ["api-authentication"],
    tags: ["api", "self-hosted", "deployment"],
  },
];

export default faqs;
