import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "free-tier-limits",
    question: "What is included in the free tier?",
    answer: `MatCraft's free tier is designed to let individual researchers and small teams evaluate the platform without any commitment. It includes everything you need to run meaningful optimization campaigns.

## Free Tier Includes

| Feature | Limit |
|---------|-------|
| Active campaigns | 3 concurrent |
| Evaluations per month | 1,000 |
| Materials | 10 |
| Data points per material | 500 |
| Surrogate model size | Up to 2 hidden layers, 128 neurons each |
| Domain plugins | All 16 built-in domains |
| Team members | 1 (individual only) |
| API access | Full REST API |
| CLI access | Full CLI |
| Data export | CSV and JSON |
| Dashboard | Full access |
| Data retention | 12 months of inactivity |

## What Counts as an Evaluation?

An "evaluation" is a single call to the surrogate model, physics model, or manual evaluation entry. In a typical campaign:

- Training the surrogate model does **not** count as evaluations.
- Each candidate composition scored by the optimizer counts as one evaluation.
- A campaign with 15 iterations and batch size 5 uses approximately 75 evaluations (plus internal optimizer evaluations, which are counted separately).

For most research projects, 1,000 evaluations per month is sufficient to run 5-10 campaigns.

## Upgrading

When you approach your limits, the dashboard shows a usage indicator. You can upgrade to Pro at any time from **Settings > Billing**. Your existing data, campaigns, and results carry over seamlessly.

## Self-Hosted

If you self-host the open-source core, there are no limits on campaigns, evaluations, or team size. The free tier limits only apply to the managed cloud service at matcraft.io.

## Academic Users

Students and faculty at accredited institutions can apply for a free Academic tier that includes Pro-level limits. See the "Academic Discount" FAQ for details.`,
    category: "pricing",
    order: 0,
    relatedSlugs: ["what-is-pro-plan", "academic-discount-available"],
    tags: ["free", "limits", "tier"],
  },
  {
    slug: "what-is-pro-plan",
    question: "What does the Pro plan include?",
    answer: `The Pro plan is designed for active researchers and small teams who need higher limits and collaboration features. It costs $49/month per seat (billed annually) or $59/month billed monthly.

## Pro Plan Features

| Feature | Limit |
|---------|-------|
| Active campaigns | 25 concurrent |
| Evaluations per month | 25,000 |
| Materials | Unlimited |
| Data points per material | 10,000 |
| Surrogate model size | Up to 4 hidden layers, 512 neurons each |
| Domain plugins | All 16 built-in + custom domains |
| Team members | Up to 10 |
| API access | Full REST API with higher rate limits |
| Priority support | Email with 24-hour response time |
| Data export | CSV, JSON, Excel, and Parquet |
| Integrations | Webhook notifications, Slack alerts |
| Campaign history | Unlimited retention |
| GPU training | Shared GPU pool for surrogate training |

## Collaboration Features

Pro unlocks team collaboration:

- **Shared campaigns**: Multiple team members can view and contribute to the same campaign.
- **Role-based access**: Assign Owner, Editor, or Viewer roles per campaign.
- **Activity log**: Track who made changes, added data, or launched iterations.
- **Comments**: Leave notes on specific candidates or Pareto front points.

## Comparison to Free

The biggest practical differences are:

1. **25x more evaluations**: Run larger campaigns with bigger batch sizes.
2. **Team access**: Collaborate with up to 10 colleagues.
3. **Custom domains**: Register and use your own domain plugins.
4. **GPU training**: Surrogate models train 5-10x faster on GPU.
5. **Priority support**: Get help within 24 hours.

## Volume Discounts

For teams larger than 5 seats, annual billing includes a 15% volume discount. Contact sales@matcraft.io for custom quotes.

## Trial

New users can start a 14-day free trial of Pro without entering payment information. At the end of the trial, you can choose to subscribe or your account automatically reverts to the free tier with all data preserved.`,
    category: "pricing",
    order: 1,
    relatedSlugs: ["free-tier-limits", "enterprise-features"],
    tags: ["pro", "plan", "pricing"],
  },
  {
    slug: "enterprise-features",
    question: "What does the Enterprise plan include?",
    answer: `The Enterprise plan is designed for organizations that need advanced security, compliance, dedicated infrastructure, and custom integrations. Pricing is based on your organization's needs -- contact sales@matcraft.io for a quote.

## Enterprise Features

### Security & Compliance

- **SSO/SAML**: Integrate with your organization's identity provider (Okta, Azure AD, OneLogin, PingFederate). Enforce MFA and session policies through your IdP.
- **Audit logging**: Comprehensive logs of all user actions, API calls, and data access. Exportable in SIEM-compatible formats (CEF, JSON).
- **SOC 2 Type II**: Attestation available upon request under NDA.
- **Data Processing Agreement (DPA)**: Custom DPA with your organization's legal requirements.
- **IP allowlisting**: Restrict API and dashboard access to your corporate network.
- **Custom data residency**: Choose your AWS region for data storage (US, EU, Asia-Pacific).

### Infrastructure

- **Dedicated compute**: Your campaigns run on isolated infrastructure, not shared with other customers. This guarantees consistent performance.
- **GPU allocation**: Dedicated GPU instances for surrogate training with guaranteed availability.
- **Custom scaling**: Configure worker pool sizes, concurrency limits, and priority queues.
- **99.9% SLA**: Uptime guarantee with financial credits for downtime.

### Collaboration

- **Unlimited seats**: No per-seat limits.
- **Organization hierarchy**: Create teams, departments, and projects with nested permissions.
- **Cross-team sharing**: Share materials and campaign templates across teams with controlled access.

### Support

- **Dedicated Slack channel**: Direct access to the MatCraft engineering team.
- **Onboarding assistance**: A solutions engineer helps your team set up their first campaigns and custom domain plugins.
- **Quarterly business reviews**: Regular check-ins to review usage, discuss roadmap, and optimize your workflow.
- **Custom integrations**: We can build connectors to your internal LIMS, ELN, or simulation infrastructure.

### Advanced Features

- **Campaign templates**: Create reusable campaign configurations that enforce organizational standards.
- **Approval workflows**: Require manager approval before running campaigns that exceed cost thresholds.
- **Budget controls**: Set monthly evaluation budgets per team or project.

## Getting Started

Contact sales@matcraft.io or fill out the form at matcraft.io/enterprise. Most enterprise deployments are live within 2-4 weeks.`,
    category: "pricing",
    order: 2,
    relatedSlugs: ["what-is-pro-plan", "data-privacy-policy"],
    tags: ["enterprise", "security", "compliance"],
  },
  {
    slug: "academic-discount-available",
    question: "Is there an academic discount?",
    answer: `Yes. MatCraft offers free Pro-level access to students, faculty, and researchers at accredited academic institutions. We believe cost should not be a barrier to adopting modern materials optimization tools in research.

## Academic Tier Details

The Academic tier includes all Pro plan features at no cost:

- 25 concurrent campaigns
- 25,000 evaluations per month
- Unlimited materials
- Custom domain plugins
- GPU-accelerated surrogate training
- Full API and CLI access

## Eligibility

The Academic tier is available to:

- **Students**: Undergraduate and graduate students enrolled at an accredited university or college. Verification via .edu email address or student ID.
- **Faculty & Researchers**: Professors, postdocs, and research staff at accredited institutions. Verification via institutional email or faculty page link.
- **Research Labs**: Academic research groups can apply for a team Academic license covering up to 20 members.

## How to Apply

1. Sign up for a free MatCraft account.
2. Go to **Settings > Billing > Academic Program**.
3. Enter your institutional email address and department.
4. Upload verification (student ID, faculty page URL, or institutional letter).
5. Applications are typically approved within 1-2 business days.

## Terms

- Academic licenses are valid for 1 year and renewable upon verification of continued affiliation.
- Research performed using MatCraft may be published freely. We only ask that you cite MatCraft in your publications (citation format provided in the dashboard).
- Academic licenses may not be used for commercial product development. If your research transitions to a commercial product, please contact us about a commercial license.
- Data generated under an academic license is yours and can be exported at any time.

## Institutional Agreements

For university-wide deployments or multi-department agreements, we offer institutional licenses with centralized administration. Contact academic@matcraft.io for details.

## Open-Source Alternative

The core MatCraft library is always free and open source, regardless of academic affiliation. The Academic tier specifically covers the managed cloud platform and web dashboard.`,
    category: "pricing",
    order: 3,
    relatedSlugs: ["free-tier-limits", "what-is-pro-plan"],
    tags: ["academic", "discount", "education"],
  },
  {
    slug: "how-billing-works",
    question: "How does billing work?",
    answer: `MatCraft uses a straightforward subscription billing model with no hidden fees or overage charges.

## Billing Cycle

- **Monthly plans**: Billed on the same date each month (e.g., if you subscribe on March 15, you are billed on the 15th of each subsequent month).
- **Annual plans**: Billed once per year at a 17% discount compared to monthly billing ($49/month vs. $59/month for Pro).

## Payment Methods

We accept:

- Credit and debit cards (Visa, Mastercard, American Express)
- ACH bank transfers (US only, annual plans only)
- Wire transfers (Enterprise plans, annual billing)
- Purchase orders (Enterprise plans, contact sales)

All payments are processed securely through Stripe. MatCraft does not store your payment card details.

## Invoices

Invoices are generated automatically at the start of each billing period and available in **Settings > Billing > Invoices**. Each invoice includes:

- Plan name and billing period
- Number of seats
- Subtotal, applicable taxes, and total
- Payment method used

Invoices can be downloaded as PDF for expense reporting.

## Seat Management

- **Adding seats**: You can add team members at any time. The cost for new seats is prorated for the remainder of the current billing period.
- **Removing seats**: Seat reductions take effect at the next billing cycle. The removed member retains access until the end of the current period.

## Usage Tracking

Monitor your evaluation usage in real-time at **Settings > Usage**. The dashboard shows:

- Evaluations used this month vs. your plan limit
- Active campaigns vs. your plan limit
- Usage trends over the past 6 months

## Exceeding Limits

If you hit your monthly evaluation limit:

- Running campaigns pause automatically.
- You can still access the dashboard, view results, and export data.
- You can upgrade your plan immediately to resume campaigns.
- Evaluations do not roll over -- unused evaluations expire at the end of each billing period.

We send email notifications at 75%, 90%, and 100% of your evaluation limit.

## Taxes

Prices displayed are exclusive of tax. Applicable sales tax, VAT, or GST is calculated at checkout based on your billing address.`,
    category: "pricing",
    order: 4,
    relatedSlugs: ["what-is-pro-plan", "how-to-cancel"],
    tags: ["billing", "payment", "invoices"],
  },
  {
    slug: "how-to-cancel",
    question: "How do I cancel my subscription?",
    answer: `You can cancel your MatCraft subscription at any time. There are no cancellation fees or long-term commitments.

## How to Cancel

1. Log in to your MatCraft dashboard.
2. Go to **Settings > Billing**.
3. Click **Cancel Subscription**.
4. Select a reason (optional, helps us improve).
5. Confirm the cancellation.

## What Happens After Cancellation

- **Immediate**: Your cancellation is confirmed via email.
- **Until end of billing period**: You retain full access to all Pro/Enterprise features for the remainder of your current billing period. If you cancel on day 10 of a monthly cycle, you have access for the remaining 20 days.
- **After billing period ends**: Your account automatically downgrades to the Free tier.

## Your Data

**Your data is never deleted upon cancellation.** Specifically:

- All materials, campaigns, results, and exported data remain accessible.
- If you exceed Free tier limits (e.g., more than 3 active campaigns), excess campaigns are paused but not deleted. You can resume them by upgrading again or archiving campaigns to bring your count under the limit.
- Campaign history and results are retained for 12 months of inactivity on the Free tier.

## Re-Subscribing

If you decide to come back, simply go to **Settings > Billing** and choose a plan. All your existing data, campaigns, and configurations will be available immediately. There is no re-onboarding process.

## Annual Plan Cancellation

For annual plans:

- You can cancel at any time, but no prorated refund is issued for the remaining months.
- You retain access through the end of the annual billing period.
- If you are within 30 days of your annual renewal, contact support@matcraft.io to cancel before the next charge.

## Enterprise Cancellation

Enterprise plans have a 30-day notice period specified in your contract. Contact your account manager or email sales@matcraft.io to initiate cancellation. We will work with you on data export and transition planning.

## Exporting Before Cancellation

We recommend exporting your data before cancellation:

\`\`\`bash
materia data export --all --format parquet --output ./matcraft-backup/
\`\`\``,
    category: "pricing",
    order: 5,
    relatedSlugs: ["how-billing-works", "free-tier-limits"],
    tags: ["cancel", "subscription", "downgrade"],
  },
  {
    slug: "team-accounts-setup",
    question: "How do I set up team accounts?",
    answer: `MatCraft supports collaborative team workflows on Pro and Enterprise plans. Here is how to set up and manage your team.

## Creating a Team

1. Go to **Settings > Team**.
2. Click **Create Team** and enter a team name (e.g., "Membrane Research Group").
3. Your account becomes the Team Owner with full administrative privileges.

## Inviting Members

Invite team members by email:

1. Go to **Settings > Team > Members**.
2. Click **Invite Member**.
3. Enter their email address and assign a role.
4. They will receive an invitation email with a link to join.

If the invitee does not have a MatCraft account, they can create one as part of accepting the invitation.

## Roles and Permissions

| Permission | Viewer | Editor | Admin | Owner |
|-----------|--------|--------|-------|-------|
| View campaigns & results | Yes | Yes | Yes | Yes |
| Export data | Yes | Yes | Yes | Yes |
| Create/edit materials | No | Yes | Yes | Yes |
| Run campaigns | No | Yes | Yes | Yes |
| Import data | No | Yes | Yes | Yes |
| Invite members | No | No | Yes | Yes |
| Manage roles | No | No | Yes | Yes |
| Billing & plan changes | No | No | No | Yes |
| Delete team | No | No | No | Yes |

## Shared Resources

Team members share the following resources under the team's plan limits:

- **Campaigns**: All team members can see campaigns created by any team member (unless marked private).
- **Materials**: Material definitions are shared across the team.
- **Evaluation budget**: The monthly evaluation limit is pooled across all team members.

## Campaign Permissions

Individual campaigns can be restricted:

\`\`\`
Campaign "cathode-study-v3"
├── Owner: alice@lab.edu (full control)
├── Editor: bob@lab.edu (can add data, run iterations)
└── Viewer: carol@lab.edu (can view results only)
\`\`\`

## API Access

Each team member generates their own API token. Tokens inherit the member's role permissions. For CI/CD pipelines, create a dedicated service account:

1. Go to **Settings > Team > Service Accounts**.
2. Click **Create Service Account**.
3. Assign it a name (e.g., "CI Pipeline") and role (typically Editor).
4. Generate and securely store its API token.

## Team Billing

All seats are billed to the Team Owner's payment method. The cost is $49/seat/month (annual) or $59/seat/month (monthly). Viewers count as seats. Service accounts do not count as seats.`,
    category: "pricing",
    order: 6,
    relatedSlugs: ["what-is-pro-plan", "enterprise-features"],
    tags: ["team", "collaboration", "roles"],
  },
  {
    slug: "api-rate-limits",
    question: "What are the API rate limits?",
    answer: `MatCraft applies rate limits to the REST API to ensure fair usage and platform stability. Limits vary by plan.

## Rate Limits by Plan

| Plan | Requests per minute | Requests per hour | Concurrent campaigns |
|------|--------------------|--------------------|---------------------|
| Free | 60 | 1,000 | 3 |
| Pro | 300 | 10,000 | 25 |
| Enterprise | Custom (default: 1,000) | Custom (default: 50,000) | Unlimited |

## How Rate Limits Work

Rate limits are applied per API token (not per IP address). When you exceed a limit, the API returns a \`429 Too Many Requests\` response with headers indicating when you can retry:

\`\`\`
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1680000060
Retry-After: 45
\`\`\`

## Rate Limit Headers

Every API response includes rate limit information:

\`\`\`
X-RateLimit-Limit: 300          # Your plan's per-minute limit
X-RateLimit-Remaining: 247      # Requests remaining in current window
X-RateLimit-Reset: 1680000060   # Unix timestamp when the window resets
\`\`\`

## SDK Handling

The Python SDK automatically handles rate limiting with exponential backoff:

\`\`\`python
from materia import Client

client = Client(
    base_url="https://api.matcraft.io",
    token="mc_live_abc123...",
    max_retries=3,           # Retry up to 3 times on 429
    retry_backoff_factor=2,  # Wait 2, 4, 8 seconds between retries
)
\`\`\`

## Endpoint-Specific Limits

Some endpoints have additional limits to prevent abuse:

| Endpoint | Additional Limit |
|----------|-----------------|
| \`POST /v1/campaigns\` | 10 per hour (Free), 50 per hour (Pro) |
| \`POST /v1/data/import\` | 100 MB per request |
| \`GET /v1/campaigns/:id/stream\` | 5 concurrent WebSocket connections |
| \`POST /v1/evaluate\` | Counted against monthly evaluation limit |

## Batch API

For bulk operations, use the batch API endpoint which counts as a single request regardless of the number of items:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/batch \\
  -H "Authorization: Bearer $MATCRAFT_TOKEN" \\
  -d '{
    "requests": [
      {"method": "GET", "path": "/v1/materials/mat-001"},
      {"method": "GET", "path": "/v1/materials/mat-002"},
      {"method": "GET", "path": "/v1/campaigns?material_id=mat-001"}
    ]
  }'
\`\`\`

## Requesting Higher Limits

If your workflow requires higher rate limits, contact support@matcraft.io with your use case. Enterprise customers can configure custom limits as part of their contract.`,
    category: "pricing",
    order: 7,
    relatedSlugs: ["how-to-use-python-sdk", "enterprise-features"],
    tags: ["api", "rate-limits", "throttling"],
  },
];

export default faqs;
