import { DocPage } from "../index";

const page: DocPage = {
  slug: "objectives",
  title: "Objectives",
  description: "Define optimization targets and trade-offs for your materials.",
  category: "mdl",
  order: 2,
  lastUpdated: "2026-04-01",
  tags: ["mdl", "objectives", "multi-objective"],
  readingTime: 6,
  body: `
## Objectives

Objectives define the properties you want to optimize. Each objective has a direction (maximize or minimize) and represents a measurable quantity returned by the evaluation function.

### Basic Syntax

\`\`\`yaml
objectives:
  - name: tensile_strength
    direction: maximize
    unit: MPa

  - name: cost
    direction: minimize
    unit: USD/kg
\`\`\`

### Objective Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| \`name\` | Yes | string | Unique identifier |
| \`direction\` | Yes | string | \`maximize\` or \`minimize\` |
| \`unit\` | No | string | Physical unit (display only) |
| \`description\` | No | string | Human-readable description |
| \`reference_point\` | No | number | Reference value for hypervolume calculation |
| \`weight\` | No | number | Relative importance for scalarization (default: 1.0) |

### Single-Objective Optimization

When only one objective is specified, MatCraft performs single-objective optimization. CMA-ES directly optimizes this objective and returns the single best solution:

\`\`\`yaml
objectives:
  - name: conductivity
    direction: maximize
    unit: S/cm
\`\`\`

### Multi-Objective Optimization

When two or more objectives are specified, MatCraft performs multi-objective optimization and returns the Pareto front -- the set of solutions where no objective can be improved without worsening another:

\`\`\`yaml
objectives:
  - name: energy_density
    direction: maximize
    unit: Wh/kg

  - name: power_density
    direction: maximize
    unit: W/kg

  - name: cycle_life
    direction: maximize
    unit: cycles
\`\`\`

MatCraft supports up to 5 simultaneous objectives. Beyond 3 objectives, the Pareto front becomes a high-dimensional surface and visualization becomes more challenging. Consider whether all objectives are truly independent.

### Reference Points

The hypervolume indicator requires a reference point -- a point in objective space that is dominated by all Pareto-optimal solutions. MatCraft auto-computes reference points, but you can specify them explicitly for consistent comparison across campaigns:

\`\`\`yaml
objectives:
  - name: permeability
    direction: maximize
    unit: L/(m2*h*bar)
    reference_point: 0.0

  - name: selectivity
    direction: maximize
    unit: "-"
    reference_point: 0.0
\`\`\`

For maximize objectives, the reference point should be at or below the worst expected value. For minimize objectives, it should be at or above the worst expected value.

### Objective Weights

When scalarization is needed (e.g., for certain convergence criteria), weights control relative importance:

\`\`\`yaml
objectives:
  - name: strength
    direction: maximize
    weight: 2.0   # Twice as important as cost

  - name: cost
    direction: minimize
    weight: 1.0
\`\`\`

Weights do not affect Pareto computation. They are only used when the optimizer needs a scalar fitness value, such as for CMA-ES internal population ranking.

### Evaluation Return Format

The domain plugin's evaluation function must return values for every declared objective. The return type is a dictionary mapping objective names to float values:

\`\`\`python
def evaluate(params: dict) -> dict:
    # Physics simulation or model prediction
    strength = compute_strength(params)
    cost = compute_cost(params)
    return {
        "tensile_strength": strength,
        "cost": cost,
    }
\`\`\`

If an evaluation returns \`None\` or \`NaN\` for any objective, the candidate is marked as failed and excluded from surrogate training.

### Common Objective Pairs

Many material optimization problems involve well-known trade-offs:

| Domain | Objective 1 | Objective 2 | Trade-off |
|--------|-------------|-------------|-----------|
| Water | Permeability | Salt rejection | Higher flux reduces selectivity |
| Battery | Energy density | Cycle life | High capacity degrades faster |
| Solar | Efficiency | Stability | Novel absorbers degrade faster |
| Catalyst | Activity | Selectivity | Higher conversion reduces purity |
| Polymer | Strength | Toughness | Stiff materials are brittle |

See the [Multi-Objective Optimization](/docs/optimization/multi-objective) guide for strategies to navigate these trade-offs.
`,
};

export default page;
