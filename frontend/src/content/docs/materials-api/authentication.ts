import { DocPage } from "../index";

const page: DocPage = {
  slug: "authentication",
  title: "Authentication",
  description: "JWT tokens, OAuth providers, and guest access for the MatCraft API.",
  category: "materials-api",
  order: 1,
  lastUpdated: "2026-04-10",
  tags: ["api", "authentication", "jwt", "oauth"],
  readingTime: 5,
  body: `
## Authentication

The MatCraft API supports three authentication methods: JWT bearer tokens, OAuth social login, and anonymous guest access.

### Guest Access

Most read-only endpoints are accessible without authentication. Guest requests are rate-limited to 100 requests per hour and cannot access builder endpoints or export features.

\`\`\`bash
# No auth header needed for basic queries
curl "https://matcraft.io/api/materials?formula=Si"
\`\`\`

### JWT Bearer Tokens

For higher rate limits and full API access, authenticate with a JWT token:

\`\`\`bash
curl "https://matcraft.io/api/materials" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

#### Obtaining a Token

1. Sign in to MatCraft via the web UI
2. Navigate to Settings > API Keys
3. Click "Generate New Token"
4. Copy the token (it is shown only once)

Tokens expire after 30 days by default. You can set a custom expiration when generating the token.

#### Token Refresh

If your token is about to expire, exchange it for a new one:

\`\`\`bash
curl -X POST "https://matcraft.io/api/auth/refresh" \\
  -H "Authorization: Bearer YOUR_CURRENT_TOKEN"
\`\`\`

Response:

\`\`\`json
{
  "data": {
    "token": "eyJhbGciOi...",
    "expires_at": "2026-05-10T00:00:00Z"
  }
}
\`\`\`

### OAuth Social Login

MatCraft supports sign-in via Google, GitHub, and ORCID. The OAuth flow is handled by the web UI and results in a JWT token that can be used for API access.

#### OAuth Flow (for custom integrations)

1. Redirect users to \`https://matcraft.io/auth/{provider}\` where provider is \`google\`, \`github\`, or \`orcid\`
2. After authentication, the user is redirected to your callback URL with a \`code\` parameter
3. Exchange the code for a JWT token:

\`\`\`bash
curl -X POST "https://matcraft.io/api/auth/token" \\
  -H "Content-Type: application/json" \\
  -d '{"provider": "github", "code": "abc123", "redirect_uri": "https://yourapp.com/callback"}'
\`\`\`

### Security Best Practices

- Never expose tokens in client-side code or version control
- Use environment variables to store tokens in scripts
- Rotate tokens regularly
- Use the minimum required scope for your use case
- Monitor your usage via the API dashboard to detect unauthorized access
`,
};

export default page;
