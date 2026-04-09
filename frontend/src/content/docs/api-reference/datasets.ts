import { DocPage } from "../index";

const page: DocPage = {
  slug: "datasets",
  title: "Datasets API",
  description: "Upload and manage evaluation datasets for warm-starting campaigns.",
  category: "api-reference",
  order: 3,
  lastUpdated: "2026-04-01",
  tags: ["api", "datasets", "data", "upload"],
  readingTime: 6,
  body: `
## Datasets API

The Datasets API allows you to upload historical evaluation data that can be used to warm-start optimization campaigns. Instead of starting from scratch, the surrogate model can be pre-trained on existing data, accelerating convergence.

### Upload a Dataset

\`\`\`
POST /v1/datasets
\`\`\`

Upload a CSV file with parameter columns and objective columns:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/datasets \\
  -H "Authorization: Bearer mc_live_abc123" \\
  -F "file=@historical_data.csv" \\
  -F "name=lab-experiments-2025" \\
  -F "description=Historical membrane experiments from Lab 3"
\`\`\`

The CSV must have a header row matching parameter and objective names from your MDL file:

\`\`\`csv
polymer_concentration,crosslinker_ratio,pore_size_nm,permeability,salt_rejection
0.15,0.05,10.2,25.3,96.1
0.22,0.08,5.1,14.7,98.5
0.18,0.03,15.8,32.1,93.2
\`\`\`

**Response** (\`201 Created\`):

\`\`\`json
{
  "data": {
    "id": "ds_def456",
    "name": "lab-experiments-2025",
    "description": "Historical membrane experiments from Lab 3",
    "rows": 150,
    "columns": ["polymer_concentration", "crosslinker_ratio", "pore_size_nm", "permeability", "salt_rejection"],
    "created_at": "2026-04-01T10:00:00Z",
    "size_bytes": 12480
  }
}
\`\`\`

### List Datasets

\`\`\`
GET /v1/datasets
\`\`\`

\`\`\`bash
curl https://api.matcraft.io/v1/datasets \\
  -H "Authorization: Bearer mc_live_abc123"
\`\`\`

### Get Dataset Details

\`\`\`
GET /v1/datasets/{dataset_id}
\`\`\`

Returns metadata and a preview of the first 10 rows.

### Download a Dataset

\`\`\`
GET /v1/datasets/{dataset_id}/download
\`\`\`

Returns the dataset as a CSV file download.

### Delete a Dataset

\`\`\`
DELETE /v1/datasets/{dataset_id}
\`\`\`

Permanently removes the dataset. Campaigns that were warm-started with this dataset are unaffected -- the data has already been copied into their evaluation history.

### Warm-Starting a Campaign

Use a dataset to warm-start a new campaign by referencing it at creation time:

\`\`\`bash
curl -X POST https://api.matcraft.io/v1/campaigns \\
  -H "Authorization: Bearer mc_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "membrane-v3-warmstart",
    "domain": "water",
    "dataset_id": "ds_def456",
    "mdl": { ... }
  }'
\`\`\`

When the campaign starts, the dataset rows are treated as already-evaluated candidates. The surrogate is trained on this data before the first acquisition step, effectively skipping the initial LHS sampling phase.

### Data Validation

When uploading a dataset, the API validates:

- **Column matching**: All parameter and objective columns from the linked MDL must be present.
- **Type checking**: Values must be parseable as the declared parameter types.
- **Bounds checking**: Parameter values should fall within declared bounds (violations produce warnings, not errors).
- **Missing values**: Rows with NaN or empty objective values are flagged and excluded from training.

### Supported Formats

| Format | MIME Type | Notes |
|--------|-----------|-------|
| CSV | \`text/csv\` | Comma-separated, UTF-8 encoded |
| JSON | \`application/json\` | Array of objects |
| Parquet | \`application/parquet\` | Efficient for large datasets |

### Size Limits

| Plan | Max file size | Max rows |
|------|--------------|----------|
| Free | 10 MB | 10,000 |
| Pro | 100 MB | 100,000 |
| Enterprise | 1 GB | 1,000,000 |
`,
};

export default page;
