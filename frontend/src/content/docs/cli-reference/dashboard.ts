import { DocPage } from "../index";

const page: DocPage = {
  slug: "dashboard",
  title: "materia dashboard",
  description: "Launch an interactive web dashboard for campaign visualization and analysis.",
  category: "cli-reference",
  order: 4,
  lastUpdated: "2026-04-01",
  tags: ["cli", "dashboard", "visualization", "web-ui"],
  readingTime: 5,
  body: `
## materia dashboard

Launch a local web dashboard for interactive visualization of optimization results. The dashboard provides convergence plots, Pareto front visualization, parameter exploration, and surrogate diagnostics.

### Synopsis

\`\`\`bash
materia dashboard [options] [results-dir]
\`\`\`

### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| \`results-dir\` | No | \`./results/\` | Path to the results directory |

### Options

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| \`--port\` | \`-p\` | integer | \`3000\` | Port for the web server |
| \`--host\` | | string | \`localhost\` | Host to bind to |
| \`--no-open\` | | boolean | false | Do not auto-open browser |
| \`--live\` | | boolean | false | Enable live updates for running campaigns |

### Basic Usage

Launch the dashboard for a completed campaign:

\`\`\`bash
materia dashboard
\`\`\`

This starts a local web server and opens \`http://localhost:3000\` in your default browser.

### Dashboard Panels

The dashboard provides four main panels:

#### 1. Convergence Plot

Shows the hypervolume indicator (or best objective for single-objective campaigns) over iterations. Key features:

- Iteration-by-iteration hypervolume progression
- Convergence detection threshold band
- Budget usage indicator
- Surrogate training loss overlay (toggle)

#### 2. Pareto Front

Interactive scatter plot of objective values for all evaluated candidates:

- Pareto-optimal solutions are highlighted in blue
- Dominated solutions shown in gray
- Click a point to see full parameter and objective values
- Zoom and pan controls
- For 3-objective problems, a 3D rotatable surface
- For 4+ objectives, parallel coordinates visualization

#### 3. Parameter Explorer

Visualizations of the sampled parameter space:

- **Histograms**: Distribution of each parameter across all evaluated candidates
- **Parallel coordinates**: All parameters displayed simultaneously with Pareto solutions highlighted
- **Scatter matrix**: Pairwise parameter correlations colored by objective values
- **Importance ranking**: Parameter sensitivity analysis based on surrogate model gradients

#### 4. Surrogate Diagnostics

Performance metrics for the surrogate model:

- **Predicted vs. actual**: Scatter plot comparing surrogate predictions with true evaluations
- **Training loss history**: Loss curve over epochs for each iteration
- **R-squared**: Prediction accuracy metric per objective
- **Residual distribution**: Histogram of prediction errors

### Live Mode

When monitoring a running campaign, use \`--live\` for real-time updates:

\`\`\`bash
# In terminal 1: Start the campaign
materia run --verbose

# In terminal 2: Launch live dashboard
materia dashboard --live
\`\`\`

The dashboard polls for new data every 5 seconds and updates all plots automatically. Convergence and Pareto plots animate as new iterations complete.

### Custom Port

If port 3000 is in use:

\`\`\`bash
materia dashboard --port 8080
\`\`\`

### Remote Access

To make the dashboard accessible from other machines on the network:

\`\`\`bash
materia dashboard --host 0.0.0.0 --port 3000
\`\`\`

Then access from another machine at \`http://<your-ip>:3000\`.

### Comparing Campaigns

Open the dashboard with multiple result directories to compare campaigns side by side:

\`\`\`bash
materia dashboard results/campaign-a/ results/campaign-b/
\`\`\`

The comparison view shows overlaid Pareto fronts and side-by-side convergence plots.

### Exporting Plots

All plots in the dashboard can be exported:

- **PNG/SVG**: Click the camera icon on any plot
- **Interactive HTML**: Click the share icon to save a standalone HTML file with Plotly interactivity

### Browser Compatibility

The dashboard requires a modern web browser with JavaScript enabled:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### See Also

- [materia results](/docs/cli-reference/results) for terminal-based results display
- [Pareto Analysis](/docs/optimization/pareto-analysis) for interpreting Pareto plots
- [Convergence](/docs/optimization/convergence) for understanding convergence plots
`,
};

export default page;
