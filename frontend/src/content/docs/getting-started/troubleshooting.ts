import { DocPage } from "../index";

const page: DocPage = {
  slug: "troubleshooting",
  title: "Troubleshooting",
  description: "Solutions for common issues when using MatCraft.",
  category: "getting-started",
  order: 7,
  lastUpdated: "2026-04-01",
  tags: ["troubleshooting", "errors", "debugging"],
  readingTime: 6,
  body: `
## Troubleshooting

This page covers common issues and their solutions. If your problem is not listed here, check the [GitHub Issues](https://github.com/matcraft/matforge/issues) or ask in the community forum.

### Installation Issues

#### pip install fails with build errors

**Symptom**: \`pip install materia\` fails with compilation errors, especially on Windows.

**Solution**: Install build tools first:

- **Windows**: Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the "Desktop development with C++" workload.
- **macOS**: Run \`xcode-select --install\`.
- **Linux**: \`sudo apt install build-essential python3-dev\`.

#### Version conflicts with numpy or scipy

**Symptom**: Import errors or version mismatch warnings after installation.

**Solution**: Create a clean virtual environment:

\`\`\`bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\\Scripts\\activate  # Windows
pip install materia
\`\`\`

### MDL Validation Errors

#### "Unknown domain" error

**Symptom**: \`materia validate\` reports an unknown domain.

\`\`\`
ValidationError: Unknown domain 'graphene'. Available domains: water, battery,
solar, catalyst, hydrogen, thermoelectric, polymer, ceramic, ...
\`\`\`

**Solution**: Check for typos in the \`domain\` field. Use \`materia init --list-domains\` to see all available domains. If you are using a custom domain, ensure the plugin is installed.

#### Parameter bounds are inverted

**Symptom**: \`bounds: [100, 10]\` causes a validation error.

**Solution**: The lower bound must come first: \`bounds: [10, 100]\`.

#### Constraint expression parse error

**Symptom**: Constraint expressions with complex syntax are rejected.

**Solution**: Use simple inequality forms supported by the parser:

\`\`\`yaml
# Supported
constraints:
  - expression: temperature >= 300
  - expression: pressure <= 10.0
  - expression: thickness >= 20

# Not supported (use separate constraints instead)
# - expression: 300 <= temperature <= 1200
\`\`\`

### Runtime Errors

#### Campaign fails with "NaN in surrogate predictions"

**Symptom**: The surrogate model produces NaN values, causing the optimizer to fail.

**Causes and solutions**:

1. **Extreme parameter ranges**: Normalize or narrow the parameter bounds. A 6-order-of-magnitude range (e.g., [0.001, 1000]) can cause numerical instability.
2. **Too few initial samples**: Increase the initial LHS sample count by adjusting \`batch_size\` or adding an explicit \`initial_samples\` setting.
3. **Evaluation returning NaN**: Check your domain plugin's evaluation function for division-by-zero or invalid physics.

#### "CUDA out of memory" when using GNN surrogates

**Symptom**: PyTorch raises a CUDA memory error during surrogate training.

**Solution**:

\`\`\`bash
# Reduce batch size
materia run --batch-size 5

# Or fall back to CPU
MATERIA_DEVICE=cpu materia run

# Or use the lighter MLP surrogate instead
# Edit material.yaml: surrogate: mlp
\`\`\`

#### Campaign hangs at "Training surrogate..."

**Symptom**: The progress stalls during surrogate model training.

**Solution**: This is usually caused by an excessively large surrogate model for the dataset size. Reduce the hidden layer sizes in \`materia.toml\`:

\`\`\`toml
[surrogate]
hidden_layers = [64, 32]  # Instead of [256, 128, 64]
epochs = 100              # Instead of 500
\`\`\`

### Dashboard Issues

#### Dashboard shows "Connection refused"

**Symptom**: \`materia dashboard\` opens the browser but shows a connection error.

**Solution**: Ensure no other process is using port 3000:

\`\`\`bash
# Check for port conflicts
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Use a different port
materia dashboard --port 3001
\`\`\`

#### Plots not updating in real time

**Symptom**: Dashboard charts freeze while the campaign is running.

**Solution**: Ensure WebSocket connectivity. If running behind a reverse proxy, configure it to support WebSocket upgrade headers.

### Performance Tips

- **Use seeds for reproducibility**: Always set \`seed\` in your MDL or config to ensure reproducible results for debugging.
- **Start with small budgets**: Use \`budget: 50\` to verify your setup works before running a full campaign.
- **Enable verbose logging**: \`materia run --verbose\` or \`MATERIA_LOG_LEVEL=debug\` to see detailed iteration logs.
- **Monitor convergence**: If hypervolume plateaus early, you may be able to stop the campaign and save time.

### Getting Help

If none of these solutions work:

1. Run \`materia validate --self-check\` and include the output in your report.
2. Collect logs: \`materia run --verbose 2>&1 | tee debug.log\`.
3. Open a [GitHub Issue](https://github.com/matcraft/matforge/issues) with your MDL file, logs, and environment details.
`,
};

export default page;
