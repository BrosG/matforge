import { DocPage } from "../index";

const page: DocPage = {
  slug: "rate-limits",
  title: "Rate Limits",
  description: "API rate limiting policies, headers, and strategies for staying within limits.",
  category: "api-reference",
  order: 8,
  lastUpdated: "2026-04-01",
  tags: ["api", "rate-limits", "throttling"],
  readingTime: 5,
  body: `
## Rate Limits

The MatCraft API enforces rate limits to ensure fair usage and platform stability. Rate limits are applied per API key and vary by plan.

### Rate Limit Tiers

| Plan | Requests/minute | Requests/hour | Concurrent campaigns |
|------|----------------|---------------|---------------------|
| Free | 60 | 1,000 | 2 |
| Pro | 300 | 10,000 | 10 |
| Enterprise | 1,000 | 50,000 | Unlimited |

### Rate Limit Headers

Every API response includes headers indicating your current rate limit status:

\`\`\`
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1711929600
\`\`\`

| Header | Description |
|--------|-------------|
| \`X-RateLimit-Limit\` | Maximum requests allowed per window |
| \`X-RateLimit-Remaining\` | Remaining requests in the current window |
| \`X-RateLimit-Reset\` | Unix timestamp when the window resets |
| \`Retry-After\` | Seconds to wait before retrying (only on 429 responses) |

### Handling Rate Limits

When you exceed the rate limit, the API returns a \`429 Too Many Requests\` response:

\`\`\`json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Retry after 12 seconds.",
    "details": {
      "limit": 300,
      "window": "1 minute",
      "retry_after": 12
    }
  }
}
\`\`\`

### Best Practices

#### 1. Check Headers Proactively

Monitor the \`X-RateLimit-Remaining\` header and slow down requests when approaching the limit:

\`\`\`python
import time

response = client._request("GET", "/campaigns")
remaining = int(response.headers.get("X-RateLimit-Remaining", 100))

if remaining < 10:
    reset_time = int(response.headers.get("X-RateLimit-Reset", 0))
    wait = max(0, reset_time - time.time())
    time.sleep(wait)
\`\`\`

#### 2. Use Exponential Backoff

When rate limited, retry with exponential backoff:

\`\`\`python
import time
from matcraft.exceptions import RateLimitError

def retry_with_backoff(func, max_retries=5):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            wait = min(2 ** attempt, 60)
            if e.retry_after:
                wait = e.retry_after
            time.sleep(wait)
    raise Exception("Max retries exceeded")
\`\`\`

#### 3. Use WebSocket Instead of Polling

Instead of polling \`GET /jobs/{id}\` every second to check progress, use the [WebSocket API](/docs/api-reference/websocket) for real-time updates. WebSocket connections count as a single request at connection time.

#### 4. Batch Operations

When creating multiple campaigns, use reasonable pacing rather than burst requests:

\`\`\`python
import time

for mdl_file in mdl_files:
    client.campaigns.create(mdl_path=mdl_file)
    time.sleep(0.5)  # 2 requests per second is well within limits
\`\`\`

#### 5. Cache Results

Cache GET responses when appropriate. Campaign results do not change after completion, so they can be cached indefinitely:

\`\`\`python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_campaign_results(campaign_id):
    return client.campaigns.get_results(campaign_id)
\`\`\`

### Endpoint-Specific Limits

Some endpoints have stricter limits due to resource intensity:

| Endpoint | Limit | Notes |
|----------|-------|-------|
| \`POST /campaigns\` | 10/minute | Campaign creation |
| \`POST /campaigns/{id}/start\` | 5/minute | Campaign execution |
| \`POST /datasets\` | 5/minute | Dataset upload |
| \`GET /campaigns/{id}/results\` | 60/minute | Results retrieval |

### Self-Hosted Rate Limits

For self-hosted deployments, rate limits can be configured in the API settings:

\`\`\`bash
# In .env
API_RATE_LIMIT_PER_MINUTE=1000
API_RATE_LIMIT_PER_HOUR=50000
\`\`\`

Set to \`0\` to disable rate limiting entirely (not recommended for multi-user deployments).
`,
};

export default page;
