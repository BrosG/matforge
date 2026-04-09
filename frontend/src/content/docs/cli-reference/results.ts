import { DocPage } from "../index";

const page: DocPage = {
  slug: "results",
  title: "materia results",
  description: "Display optimization results, Pareto front, and convergence metrics.",
  category: "cli-reference",
  order: 3,
  lastUpdated: "2026-04-01",
  tags: ["cli", "results", "pareto", "output"],
  readingTime: 5,
  body: `
## materia results

Display optimization results from a completed or running campaign. Shows Pareto-optimal solutions, convergence metrics, and evaluation history.

### Synopsis

\`\`\`bash
materia results [options] [results-dir]
\`\`\`

### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| \`results-dir\` | No | \`./results/\` | Path to the results directory |

### Options

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| \`--pareto\` | \`-p\` | boolean | false | Show only Pareto-optimal solutions |
| \`--all\` | \`-a\` | boolean | false | Show all evaluated candidates |
| \`--convergence\` | | boolean | false | Show convergence metrics |
| \`--show-dominated\` | | boolean | false | Include domination status for each candidate |
| \`--show-crowding\` | | boolean | false | Include crowding distance for Pareto solutions |
| \`--show-violations\` | | boolean | false | Show constraint violation statistics |
| \`--show-metadata\` | | boolean | false | Include evaluation metadata |
| \`--top\` | \`-n\` | integer | 20 | Limit output to top N results |
| \`--sort\` | | string | (first objective) | Sort by objective name |
| \`--format\` | \`-f\` | string | \`table\` | Output format: \`table\`, \`json\`, \`csv\` |
| \`--compare\` | | path[] | | Compare results from multiple campaigns |
| \`--metric\` | | string | \`hypervolume\` | Comparison metric |

### Basic Usage

View the Pareto front (default view):

\`\`\`bash
materia results --pareto
\`\`\`

Output:

\`\`\`
Campaign: water-membrane-v1
Status: Converged (iteration 15, 225 evaluations)
Hypervolume: 0.847

Pareto-Optimal Solutions (18 candidates):
  #   polymer_conc  crosslinker  pore_nm  thickness  anneal_c  permeability  rejection
  1   0.142         0.034        12.3     45.2       95.0      42.1          91.3%
  2   0.158         0.042        9.8      52.7       102.3     35.7          93.8%
  3   0.185         0.058        8.7      62.1       110.5     31.4          95.8%
  4   0.203         0.065        6.4      74.9       118.0     25.2          97.1%
  5   0.231         0.078        4.2      98.3       125.0     18.9          98.7%
  ...
\`\`\`

### Convergence Summary

\`\`\`bash
materia results --convergence
\`\`\`

Output:

\`\`\`
Convergence Summary:
  Total iterations:    15
  Total evaluations:   225
  Final hypervolume:   0.847
  Status:              Converged (patience exhausted at iter 15)

  Hypervolume History:
  Iter  1: 0.342  ████████░░░░░░░░░░░░░░░░░░░░░░
  Iter  2: 0.487  ██████████████░░░░░░░░░░░░░░░░
  Iter  3: 0.581  █████████████████░░░░░░░░░░░░░
  Iter  5: 0.692  ████████████████████░░░░░░░░░░
  Iter  8: 0.789  ███████████████████████░░░░░░░
  Iter 10: 0.825  ████████████████████████░░░░░░
  Iter 15: 0.847  █████████████████████████░░░░░
\`\`\`

### All Candidates

View all evaluated candidates with their domination status:

\`\`\`bash
materia results --all --show-dominated --top 10
\`\`\`

### JSON Output

\`\`\`bash
materia results --pareto --format json
\`\`\`

Output:

\`\`\`json
{
  "campaign": "water-membrane-v1",
  "hypervolume": 0.847,
  "pareto_front": [
    {
      "parameters": {"polymer_conc": 0.142, "crosslinker": 0.034, ...},
      "objectives": {"permeability": 42.1, "salt_rejection": 91.3},
      "iteration": 8,
      "crowding_distance": 0.453
    }
  ]
}
\`\`\`

### Comparing Campaigns

Compare results from multiple campaigns side by side:

\`\`\`bash
materia results --compare results/campaign-a/ results/campaign-b/ --metric hypervolume
\`\`\`

Output:

\`\`\`
Campaign Comparison:
  Campaign A: HV=0.847, 18 Pareto solutions, 225 evaluations
  Campaign B: HV=0.812, 14 Pareto solutions, 200 evaluations
  Difference: +0.035 HV (+4.3%)
\`\`\`

### Sorting

Sort results by a specific objective:

\`\`\`bash
materia results --pareto --sort permeability
materia results --pareto --sort -salt_rejection  # Descending
\`\`\`

### Constraint Violations

\`\`\`bash
materia results --show-violations
\`\`\`

Output:

\`\`\`
Constraint Violation Summary:
  Total candidates: 225
  Feasible: 218 (96.9%)
  Infeasible: 7 (3.1%)

  Violations by constraint:
    "thickness >= 30":  5 violations (avg violation: 4.2)
    "fractions <= 1.0": 2 violations (avg violation: 0.03)
\`\`\`

### See Also

- [Pareto Analysis](/docs/optimization/pareto-analysis) for interpretation guidance
- [materia export](/docs/cli-reference/export) for exporting data to files
- [materia dashboard](/docs/cli-reference/dashboard) for interactive visualization
`,
};

export default page;
