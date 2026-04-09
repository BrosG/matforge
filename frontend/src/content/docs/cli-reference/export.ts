import { DocPage } from "../index";

const page: DocPage = {
  slug: "export",
  title: "materia export",
  description: "Export optimization results to CSV, JSON, or Parquet files.",
  category: "cli-reference",
  order: 7,
  lastUpdated: "2026-04-01",
  tags: ["cli", "export", "csv", "data"],
  readingTime: 5,
  body: `
## materia export

Export optimization results to external file formats for further analysis, reporting, or integration with other tools.

### Synopsis

\`\`\`bash
materia export [options] [results-dir]
\`\`\`

### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| \`results-dir\` | No | \`./results/\` | Path to the results directory |

### Options

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| \`--format\` | \`-f\` | string | \`csv\` | Output format: \`csv\`, \`json\`, \`parquet\`, \`excel\` |
| \`--output\` | \`-o\` | path | (auto-generated) | Output file path |
| \`--pareto\` | \`-p\` | boolean | false | Export only Pareto-optimal solutions |
| \`--include-metadata\` | | boolean | false | Include evaluation metadata columns |
| \`--include-iteration\` | | boolean | true | Include iteration number column |
| \`--include-timestamp\` | | boolean | false | Include evaluation timestamp column |
| \`--delimiter\` | | string | \`,\` | CSV delimiter character |
| \`--convergence\` | | boolean | false | Export convergence history instead of evaluations |

### Basic Usage

Export all results to CSV:

\`\`\`bash
materia export --format csv --output results.csv
\`\`\`

Export only Pareto solutions:

\`\`\`bash
materia export --pareto --output pareto.csv
\`\`\`

### CSV Export

\`\`\`bash
materia export --format csv --output results.csv
\`\`\`

Generated file:

\`\`\`csv
iteration,polymer_concentration,crosslinker_ratio,pore_size_nm,membrane_thickness_um,annealing_temp_c,permeability,salt_rejection,is_pareto
1,0.152,0.042,15.3,48.2,88.0,28.4,94.2,false
1,0.231,0.078,4.2,98.3,125.0,18.9,98.7,true
2,0.185,0.058,8.7,62.1,110.5,31.4,95.8,true
...
\`\`\`

### JSON Export

\`\`\`bash
materia export --format json --output results.json
\`\`\`

Generated file:

\`\`\`json
{
  "campaign": {
    "name": "water-membrane-v1",
    "domain": "water",
    "budget": 300,
    "total_evaluations": 225,
    "hypervolume": 0.847
  },
  "evaluations": [
    {
      "iteration": 1,
      "parameters": {
        "polymer_concentration": 0.152,
        "crosslinker_ratio": 0.042,
        "pore_size_nm": 15.3,
        "membrane_thickness_um": 48.2,
        "annealing_temp_c": 88.0
      },
      "objectives": {
        "permeability": 28.4,
        "salt_rejection": 94.2
      },
      "is_pareto": false
    }
  ]
}
\`\`\`

### Parquet Export

For large datasets or integration with data science tools:

\`\`\`bash
materia export --format parquet --output results.parquet
\`\`\`

Parquet files are columnar, compressed, and efficient for pandas, Polars, and Apache Spark:

\`\`\`python
import pandas as pd
df = pd.read_parquet("results.parquet")
pareto = df[df["is_pareto"]]
\`\`\`

### Excel Export

\`\`\`bash
materia export --format excel --output results.xlsx
\`\`\`

The Excel file includes multiple sheets:

- **Evaluations**: All evaluated candidates
- **Pareto Front**: Pareto-optimal solutions only
- **Convergence**: Hypervolume history per iteration
- **Settings**: Campaign configuration summary

### Convergence History Export

Export the iteration-by-iteration convergence metrics:

\`\`\`bash
materia export --convergence --output convergence.csv
\`\`\`

Generated file:

\`\`\`csv
iteration,evaluations,hypervolume,hv_improvement,pareto_size,surrogate_loss,best_permeability,best_salt_rejection
1,15,0.342,,4,0.0523,12.4,97.2
2,30,0.487,0.145,7,0.0234,18.7,98.1
3,45,0.581,0.094,9,0.0187,24.1,98.4
...
\`\`\`

### Including Metadata

Some domains attach additional metadata to evaluations (e.g., predicted phase, intermediate calculations):

\`\`\`bash
materia export --include-metadata --output results_full.csv
\`\`\`

### Auto-Generated Filenames

If \`--output\` is not specified, the filename is auto-generated:

\`\`\`
<campaign-name>_<type>_<timestamp>.<ext>
\`\`\`

Example: \`water-membrane-v1_pareto_20260401_120000.csv\`

### Piping to stdout

Omit \`--output\` and use \`--format csv\` to pipe directly to other tools:

\`\`\`bash
materia export --pareto --format csv | head -5
materia export --pareto --format json | jq '.evaluations | length'
\`\`\`

### See Also

- [materia results](/docs/cli-reference/results) for viewing results in the terminal
- [Datasets API](/docs/api-reference/datasets) for uploading exported data
- [Pareto Analysis](/docs/optimization/pareto-analysis) for understanding Pareto solutions
`,
};

export default page;
