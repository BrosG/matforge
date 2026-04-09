import { DocPage } from "../index";

const page: DocPage = {
  slug: "authentication",
  title: "Authentication",
  description: "API key management, scopes, and security best practices.",
  category: "api-reference",
  order: 6,
  lastUpdated: "2026-04-01",
  tags: ["api", "authentication", "security", "api-keys"],
  readingTime: 6,
  body: `
## Authentication

All MatCraft API requests require authentication via API keys. This page covers key management, scopes, and security best practices.

### API Key Format

MatCraft API keys use a prefixed format for easy identification:

| Prefix | Environment | Usage |
|--------|-------------|-------|
| \`mc_live_\` | Production | Live API access |
| \`mc_test_\` | Sandbox | Testing and development |
| \`mc_ci_\` | CI/CD | Automated pipeline access |

Example: \`mc_live_sk_a1b2c3d4e5f6g7h8i9j0\`

### Using API Keys

Pass the API key in the \`Authorization\` header using Bearer token format:

\`\`\`bash
curl -H "Authorization: Bearer mc_live_sk_a1b2c3..." \\
  https://api.matcraft.io/v1/campaigns
\`\`\`

With the Python SDK:

\`\`\`python
from matcraft import MatCraftClient

client = MatCraftClient(api_key="mc_live_sk_a1b2c3...")
\`\`\`

Using environment variables (recommended):

\`\`\`bash
export MATERIA_API_KEY="mc_live_sk_a1b2c3..."
\`\`\`

\`\`\`python
from matcraft import MatCraftClient

# Automatically reads MATERIA_API_KEY
client = MatCraftClient()
\`\`\`

### Key Scopes

API keys can be scoped to limit their permissions:

| Scope | Description | Endpoints |
|-------|-------------|-----------|
| \`campaigns:read\` | View campaigns and results | GET /campaigns, GET /results |
| \`campaigns:write\` | Create, start, stop campaigns | POST /campaigns, POST /start |
| \`campaigns:delete\` | Delete campaigns | DELETE /campaigns |
| \`datasets:read\` | View and download datasets | GET /datasets |
| \`datasets:write\` | Upload datasets | POST /datasets |
| \`templates:read\` | Browse templates | GET /templates |
| \`admin\` | Full access including key management | All endpoints |

Create a scoped key via the dashboard or API:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/api-keys \\
  -H "Authorization: Bearer mc_live_sk_admin_key..." \\
  -d '{
    "name": "CI Pipeline Key",
    "scopes": ["campaigns:read", "campaigns:write"],
    "expires_at": "2027-01-01T00:00:00Z"
  }'
\`\`\`

### Key Rotation

For security, rotate API keys periodically:

1. Create a new key with the same scopes.
2. Update your applications to use the new key.
3. Verify the new key works.
4. Revoke the old key.

\`\`\`bash
# Revoke an old key
curl -X DELETE https://api.matcraft.io/v1/api-keys/key_abc123 \\
  -H "Authorization: Bearer mc_live_sk_admin_key..."
\`\`\`

### Security Best Practices

1. **Never commit API keys to version control**. Use environment variables or secret managers.

2. **Use scoped keys**. Give each application the minimum permissions it needs.

3. **Set expiration dates**. Keys should expire and be rotated regularly.

4. **Use test keys for development**. \`mc_test_\` keys access a sandbox environment that does not consume production resources.

5. **Monitor key usage**. The API dashboard shows request counts and last-used timestamps for each key.

6. **IP allowlisting** (Enterprise). Restrict API key usage to specific IP addresses or CIDR ranges:

\`\`\`bash
curl -X PATCH https://api.matcraft.io/v1/api-keys/key_abc123 \\
  -H "Authorization: Bearer mc_live_sk_admin_key..." \\
  -d '{"allowed_ips": ["203.0.113.0/24", "198.51.100.42"]}'
\`\`\`

### Self-Hosted Authentication

For self-hosted deployments, configure the API secret key in your \`.env\`:

\`\`\`bash
API_SECRET_KEY=your-secret-key-here
\`\`\`

This key is used to sign and verify JWT tokens for the web dashboard. API keys for programmatic access are stored in the database and managed via the admin interface.

### Troubleshooting

- **401 Unauthorized**: Check that the key is correct and not expired. Verify the \`Authorization\` header format.
- **403 Forbidden**: The key does not have the required scope for this endpoint. Check the key's assigned scopes.
- **Key not working after rotation**: Ensure there is no caching layer (CDN, reverse proxy) that is caching the old authentication header.
`,
};

export default page;
