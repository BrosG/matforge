import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "do-i-need-account",
    question: "Do I need an account to use MatCraft?",
    answer: `No, many features are available without an account:

## Available Without Account (Guest Access)

- Browse and search all 205,000+ materials
- View material properties, crystal structures, and electronic data
- Use the scatter plot tool
- View phase diagrams
- Download structure files (CIF, POSCAR, XYZ)
- Access the API (100 requests/hour)

## Requires Free Account

- Higher API rate limits (1,000 requests/hour)
- Structure builder tools (supercell, surface, nanoparticle, substitution)
- Jupyter notebook export
- Saved searches and bookmarks
- Material comparator (save comparisons)

## Requires Premium Account

- 10,000 API requests/hour
- Priority support
- Early access to new features

Creating a free account takes 30 seconds using Google, GitHub, or ORCID sign-in.`,
    category: "accounts",
    order: 0,
    relatedSlugs: ["how-to-create-account", "guest-vs-authenticated"],
    tags: ["account", "guest", "access"],
  },
  {
    slug: "how-to-create-account",
    question: "How do I create an account?",
    answer: `MatCraft supports social login through three providers:

## Google Sign-In

1. Click "Sign In" in the top navigation
2. Select "Continue with Google"
3. Choose your Google account
4. You are automatically signed in and redirected to the dashboard

## GitHub Sign-In

1. Click "Sign In"
2. Select "Continue with GitHub"
3. Authorize the MatCraft OAuth app
4. Your GitHub profile name and email are used for your MatCraft account

## ORCID Sign-In

1. Click "Sign In"
2. Select "Continue with ORCID"
3. Log in to your ORCID account and authorize MatCraft
4. Your ORCID iD is linked to your MatCraft profile

No password is needed -- authentication is handled entirely by the OAuth provider. Your account is created automatically on first sign-in.`,
    category: "accounts",
    order: 1,
    relatedSlugs: ["do-i-need-account", "how-to-get-api-key"],
    tags: ["account", "registration", "oauth"],
  },
  {
    slug: "how-to-get-api-key",
    question: "How do I get an API key?",
    answer: `API keys (JWT tokens) are available to registered users:

1. Sign in to MatCraft
2. Click your profile avatar in the top right
3. Select **Settings**
4. Go to the **API Keys** tab
5. Click **Generate New Token**
6. Optionally set an expiration date (default: 30 days)
7. Copy the token immediately -- it is shown only once

## Using Your Token

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.matcraft.ai/api/v1/materials"
\`\`\`

## Managing Tokens

- You can have up to 5 active tokens
- Revoke any token from the API Keys settings page
- Tokens can be regenerated at any time
- If you lose a token, revoke it and generate a new one`,
    category: "accounts",
    order: 2,
    relatedSlugs: ["how-to-create-account", "api-rate-limits"],
    tags: ["api-key", "token", "jwt"],
  },
  {
    slug: "guest-vs-authenticated",
    question: "What is the difference between guest and authenticated access?",
    answer: `Guest access (no sign-in) and authenticated access differ in several ways:

| Feature | Guest | Authenticated |
|---------|-------|--------------|
| Search materials | Yes | Yes |
| View properties | Yes | Yes |
| Download structures | Yes | Yes |
| API rate limit | 100/hour | 1,000/hour |
| Builder tools | No | Yes |
| Jupyter export | No | Yes |
| Saved searches | No | Yes |
| Comparator saves | No | Yes |
| Inverse design | Limited | Full |

Guest access is designed for quick lookups and casual browsing. If you plan to use MatCraft regularly or need programmatic access, creating a free account is recommended.`,
    category: "accounts",
    order: 3,
    relatedSlugs: ["do-i-need-account", "how-to-create-account"],
    tags: ["guest", "authenticated", "comparison"],
  },
  {
    slug: "delete-account",
    question: "How do I delete my account?",
    answer: `To delete your MatCraft account:

1. Sign in to MatCraft
2. Go to Settings > Account
3. Scroll to the bottom and click **Delete Account**
4. Confirm by typing your email address
5. Click **Permanently Delete**

## What Gets Deleted

- Your profile information (name, email, avatar)
- All API tokens
- Saved searches and bookmarks
- Comparison history

## What Is NOT Deleted

- Your activity does not affect the public materials database
- Previously exported files on your local machine remain
- Any data you submitted to optimization campaigns (if applicable)

Account deletion is permanent and cannot be undone. All data is removed from primary storage within 24 hours.`,
    category: "accounts",
    order: 4,
    relatedSlugs: ["how-to-create-account"],
    tags: ["account", "delete", "privacy"],
  },
  {
    slug: "change-email",
    question: "Can I change my email or linked social account?",
    answer: `MatCraft uses OAuth social login, so your account is linked to your Google, GitHub, or ORCID identity.

## Changing Email

Your email is pulled from your OAuth provider. To change it:
1. Update your email in your Google/GitHub/ORCID account
2. Sign out and sign back in to MatCraft
3. Your MatCraft profile updates automatically

## Linking Additional Providers

You can link multiple OAuth providers to the same MatCraft account:
1. Go to Settings > Account > Linked Accounts
2. Click "Link" next to an unlinked provider
3. Authorize the connection

This lets you sign in with any of your linked providers.

## Switching Primary Provider

The first provider you used to create your account is the primary. You can change this in Settings > Account > Linked Accounts by clicking "Make Primary" on a different linked provider.`,
    category: "accounts",
    order: 5,
    relatedSlugs: ["how-to-create-account"],
    tags: ["account", "email", "oauth", "settings"],
  },
  {
    slug: "data-privacy-account",
    question: "What data does MatCraft store about my account?",
    answer: `MatCraft stores minimal personal data:

## What We Store

- **Profile info**: Name, email, and avatar URL from your OAuth provider
- **OAuth tokens**: Encrypted tokens for maintaining your session
- **API keys**: Hashed JWT tokens you have generated
- **Usage data**: API request counts for rate limiting (not individual queries)
- **Preferences**: Theme setting, saved searches, comparison history

## What We Do NOT Store

- Passwords (authentication is handled by OAuth providers)
- Detailed query logs or search history
- IP addresses (beyond temporary rate limit tracking)
- Tracking cookies or advertising identifiers

## Data Export

You can export all your account data from Settings > Account > Export Data. This generates a JSON file with your profile, saved searches, and preferences.

## GDPR Compliance

For EU users, we comply with GDPR requirements including right to access, right to erasure, and data portability. Contact privacy@matcraft.ai for data requests.`,
    category: "accounts",
    order: 6,
    relatedSlugs: ["delete-account", "do-i-need-account"],
    tags: ["privacy", "data", "gdpr", "account"],
  },
  {
    slug: "enterprise-sso",
    question: "Does MatCraft support enterprise SSO (SAML/OIDC)?",
    answer: `Enterprise SSO is available on the Enterprise plan:

## Supported Protocols

- **SAML 2.0**: Compatible with Okta, Azure AD, OneLogin, PingFederate, and other SAML identity providers
- **OpenID Connect (OIDC)**: Compatible with any OIDC-compliant identity provider

## Setup

1. Contact sales@matcraft.ai to enable enterprise features
2. Provide your IdP metadata URL or SAML certificate
3. We configure the SSO connection on our end
4. Your team can sign in using your organization's identity provider

## Features

- Automatic account provisioning on first SSO login
- Group mapping for role-based access control
- Just-in-Time (JIT) provisioning
- Single logout support

For self-hosted deployments, SSO configuration is done in the environment configuration file.`,
    category: "accounts",
    order: 7,
    relatedSlugs: ["how-to-create-account"],
    tags: ["enterprise", "sso", "saml", "oidc"],
  },
];

export default faqs;
