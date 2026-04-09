import { DocPage } from "../index";

const page: DocPage = {
  slug: "overview",
  title: "CLI Overview",
  description: "Introduction to the MatCraft command-line interface and its commands.",
  category: "cli-reference",
  order: 0,
  lastUpdated: "2026-04-01",
  tags: ["cli", "overview", "commands"],
  readingTime: 5,
  body: `
## CLI Overview

The \`materia\` command-line interface provides a complete workflow for materials optimization -- from project initialization to results export. It is installed automatically with the MATERIA engine package.

### Installation

\`\`\`bash
pip install materia
\`\`\`

Verify the installation:

\`\`\`bash
materia --version
\`\`\`

### Command Summary

| Command | Description |
|---------|-------------|
| \`materia init\` | Create a new optimization project |
| \`materia run\` | Execute an optimization campaign |
| \`materia results\` | Display results and Pareto front |
| \`materia dashboard\` | Launch interactive web dashboard |
| \`materia validate\` | Check MDL file correctness |
| \`materia export\` | Export results to CSV/JSON |
| \`materia config\` | View or modify settings |

### Global Options

These flags work with any command:

| Flag | Short | Description |
|------|-------|-------------|
| \`--help\` | \`-h\` | Show help for the command |
| \`--version\` | \`-V\` | Print version information |
| \`--verbose\` | \`-v\` | Enable verbose output |
| \`--quiet\` | \`-q\` | Suppress non-essential output |
| \`--no-color\` | | Disable colored output |
| \`--config\` | \`-c\` | Path to config file |

### Usage Pattern

A typical workflow using the CLI:

\`\`\`bash
# 1. Create a new project with a domain template
materia init my-project --domain water

# 2. Edit the MDL file to customize parameters
cd my-project
# (edit material.yaml)

# 3. Validate the configuration
materia validate material.yaml

# 4. Run the optimization
materia run --verbose

# 5. View results
materia results --pareto

# 6. Launch the dashboard for interactive analysis
materia dashboard

# 7. Export results for further processing
materia export --format csv --output results.csv
\`\`\`

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid usage (wrong arguments) |
| 3 | MDL validation error |
| 4 | Runtime error (campaign failed) |
| 5 | Configuration error |

### Environment Variables

The CLI respects all \`MATERIA_*\` environment variables documented in the [Configuration](/docs/getting-started/configuration) guide. These override settings from config files.

### Shell Completion

Enable tab completion for your shell:

\`\`\`bash
# Bash
materia --install-completion bash

# Zsh
materia --install-completion zsh

# Fish
materia --install-completion fish
\`\`\`

After installation, restart your shell to enable completions for commands, flags, and domain names.

### Detailed Command Reference

Each command is documented in detail on its own page:

- [materia init](/docs/cli-reference/init) -- Project scaffolding
- [materia run](/docs/cli-reference/run) -- Campaign execution
- [materia results](/docs/cli-reference/results) -- Results display
- [materia dashboard](/docs/cli-reference/dashboard) -- Web dashboard
- [materia config](/docs/cli-reference/config) -- Configuration management
- [materia validate](/docs/cli-reference/validate) -- MDL validation
- [materia export](/docs/cli-reference/export) -- Data export
`,
};

export default page;
