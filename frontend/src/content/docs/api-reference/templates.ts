import { DocPage } from "../index";

const page: DocPage = {
  slug: "templates",
  title: "Templates API",
  description: "Browse and retrieve pre-built MDL templates via the API.",
  category: "api-reference",
  order: 4,
  lastUpdated: "2026-04-01",
  tags: ["api", "templates", "mdl"],
  readingTime: 5,
  body: `
## Templates API

The Templates API provides access to pre-built MDL templates for all supported domains. Templates give you a validated starting point for common optimization scenarios.

### List Templates

\`\`\`
GET /v1/templates
\`\`\`

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| \`domain\` | string | Filter by domain (e.g., \`water\`, \`battery\`) |
| \`search\` | string | Search in template name and description |

\`\`\`bash
curl "https://api.matcraft.ai/api/v1/templates?domain=battery" \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

**Response**:

\`\`\`json
{
  "data": [
    {
      "id": "tmpl_bat_001",
      "slug": "battery/nmc-cathode",
      "name": "NMC Cathode Composition",
      "domain": "battery",
      "description": "Optimize NMC cathode composition for capacity, cycle life, and cost",
      "parameters_count": 5,
      "objectives_count": 3,
      "default_budget": 400,
      "tags": ["cathode", "NMC", "lithium-ion"]
    },
    {
      "id": "tmpl_bat_002",
      "slug": "battery/solid-electrolyte",
      "name": "Solid-State Electrolyte",
      "domain": "battery",
      "description": "Screen solid electrolyte compositions for ionic conductivity",
      "parameters_count": 6,
      "objectives_count": 2,
      "default_budget": 350,
      "tags": ["electrolyte", "solid-state", "ionic-conductivity"]
    }
  ]
}
\`\`\`

### Get Template Details

\`\`\`
GET /v1/templates/{template_id}
\`\`\`

Returns the full template including the complete MDL definition:

\`\`\`bash
curl https://api.matcraft.ai/api/v1/templates/tmpl_bat_001 \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

**Response**:

\`\`\`json
{
  "data": {
    "id": "tmpl_bat_001",
    "slug": "battery/nmc-cathode",
    "name": "NMC Cathode Composition",
    "domain": "battery",
    "description": "Optimize NMC cathode composition for capacity, cycle life, and cost",
    "mdl": {
      "name": "nmc-cathode",
      "domain": "battery",
      "parameters": [
        {"name": "ni_content", "type": "continuous", "bounds": [0.33, 0.90]},
        {"name": "mn_content", "type": "continuous", "bounds": [0.05, 0.34]},
        {"name": "co_content", "type": "continuous", "bounds": [0.05, 0.34]},
        {"name": "calcination_temp", "type": "integer", "bounds": [700, 950]},
        {"name": "coating_thickness", "type": "continuous", "bounds": [0.0, 5.0]}
      ],
      "objectives": [
        {"name": "specific_capacity", "direction": "maximize", "unit": "mAh/g"},
        {"name": "capacity_retention", "direction": "maximize", "unit": "%"},
        {"name": "cobalt_cost", "direction": "minimize", "unit": "USD/kWh"}
      ],
      "constraints": [
        {"expression": "ni_content + mn_content + co_content <= 1.0"}
      ],
      "optimizer": {"method": "cma-es", "budget": 400, "batch_size": 20}
    }
  }
}
\`\`\`

### Create Campaign from Template

Use a template to create a campaign with optional parameter overrides:

\`\`\`bash
curl -X POST https://api.matcraft.ai/api/v1/campaigns \\
  -H "Authorization: Bearer mc_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "tmpl_bat_001",
    "name": "my-nmc-study",
    "overrides": {
      "optimizer": {
        "budget": 500,
        "seed": 42
      },
      "parameters": {
        "ni_content": {"bounds": [0.60, 0.90]}
      }
    }
  }'
\`\`\`

Overrides are merged with the template MDL. You can override any field: parameter bounds, optimizer settings, batch size, etc.

### Download Template as YAML

\`\`\`
GET /v1/templates/{template_id}/download
\`\`\`

Returns the template as a downloadable \`material.yaml\` file:

\`\`\`bash
curl -o material.yaml \\
  https://api.matcraft.ai/api/v1/templates/tmpl_bat_001/download \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

### Custom Templates

Users can save their own MDL definitions as reusable templates:

\`\`\`bash
curl -X POST https://api.matcraft.ai/api/v1/templates \\
  -H "Authorization: Bearer mc_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Custom Membrane",
    "description": "Optimized for our specific RO application",
    "mdl": { ... },
    "visibility": "private"
  }'
\`\`\`

Custom templates can be \`private\` (visible only to the creator) or \`team\` (visible to all organization members).
`,
};

export default page;
