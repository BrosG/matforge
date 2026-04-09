import { DocPage } from "../index";

const page: DocPage = {
  slug: "config",
  title: "materia config",
  description: "View and modify MatCraft configuration settings.",
  category: "cli-reference",
  order: 5,
  lastUpdated: "2026-04-01",
  tags: ["cli", "config", "settings"],
  readingTime: 5,
  body: `
## materia config

View, set, and manage MatCraft configuration settings. Configuration is stored in TOML files at the global level (\`~/.config/materia/config.toml\`) and project level (\`materia.toml\`).

### Synopsis

\`\`\`bash
materia config <subcommand> [options]
\`\`\`

### Subcommands

| Subcommand | Description |
|------------|-------------|
| \`show\` | Display current configuration |
| \`get\` | Get a specific setting value |
| \`set\` | Set a configuration value |
| \`reset\` | Reset settings to defaults |
| \`path\` | Show config file locations |
| \`set-template\` | Save an MDL file as a reusable template |

### materia config show

Display the effective configuration, showing all values and their sources:

\`\`\`bash
materia config show
\`\`\`

Output:

\`\`\`
Configuration (effective values):
  general.log_level     = info         (global config)
  general.output_format = table        (default)
  general.color         = true         (default)
  optimizer.budget      = 300          (project config)
  optimizer.surrogate   = mlp          (default)
  optimizer.method      = cma-es       (default)
  optimizer.batch_size  = 15           (project config)
  optimizer.seed        = 42           (project config)
  api.base_url          = https://api.matcraft.io  (default)
  api.api_key           = mc_live_sk_***  (environment)
\`\`\`

### materia config get

Retrieve a specific setting:

\`\`\`bash
materia config get optimizer.budget
# 300

materia config get api.base_url
# https://api.matcraft.io
\`\`\`

### materia config set

Set a configuration value. By default, settings are saved to the project config (\`materia.toml\`):

\`\`\`bash
# Set project-level settings
materia config set optimizer.budget 500
materia config set optimizer.seed 42
materia config set surrogate.hidden_layers "[128, 64, 32]"

# Set global-level settings
materia config set --global general.log_level debug
materia config set --global api.api_key mc_live_sk_...
\`\`\`

#### Options for set

| Flag | Description |
|------|-------------|
| \`--global\` | Save to global config instead of project config |
| \`--project\` | Save to project config (default) |

### materia config reset

Reset all settings to their defaults:

\`\`\`bash
# Reset project config
materia config reset

# Reset global config
materia config reset --global

# Reset a specific section
materia config reset optimizer
\`\`\`

### materia config path

Show the paths of configuration files:

\`\`\`bash
materia config path
\`\`\`

Output:

\`\`\`
Configuration files:
  Global:  ~/.config/materia/config.toml (exists)
  Project: ./materia.toml (exists)
\`\`\`

### materia config set-template

Save an MDL file as a reusable template:

\`\`\`bash
materia config set-template my-lab/custom-membrane material.yaml
\`\`\`

The template is saved to \`~/.config/materia/templates/my-lab/custom-membrane.yaml\` and can be used with:

\`\`\`bash
materia init new-project --template my-lab/custom-membrane
\`\`\`

### Configuration Keys

All available configuration keys:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| \`general.log_level\` | string | \`info\` | Logging verbosity |
| \`general.output_format\` | string | \`table\` | Default output format |
| \`general.color\` | boolean | \`true\` | Colored terminal output |
| \`optimizer.budget\` | integer | \`200\` | Default evaluation budget |
| \`optimizer.batch_size\` | integer | \`10\` | Default batch size |
| \`optimizer.method\` | string | \`cma-es\` | Default optimizer |
| \`optimizer.surrogate\` | string | \`mlp\` | Default surrogate model |
| \`optimizer.seed\` | integer | \`null\` | Default random seed |
| \`surrogate.hidden_layers\` | int[] | \`[128, 64]\` | MLP architecture |
| \`surrogate.learning_rate\` | float | \`0.001\` | Training learning rate |
| \`surrogate.epochs\` | integer | \`200\` | Max training epochs |
| \`surrogate.dropout\` | float | \`0.1\` | Dropout rate |
| \`api.base_url\` | string | \`https://api.matcraft.io\` | API endpoint |
| \`api.api_key\` | string | \`null\` | API authentication key |
| \`dashboard.port\` | integer | \`3000\` | Dashboard server port |
| \`dashboard.auto_open\` | boolean | \`true\` | Auto-open browser |

### See Also

- [Configuration Guide](/docs/getting-started/configuration) for detailed configuration documentation
- [materia init](/docs/cli-reference/init) for project scaffolding
`,
};

export default page;
