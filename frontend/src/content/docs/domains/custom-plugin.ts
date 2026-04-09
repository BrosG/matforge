import { DocPage } from "../index";

const page: DocPage = {
  slug: "custom-plugin",
  title: "Custom Plugin Development",
  description: "Build your own domain plugin to extend MatCraft with new material classes.",
  category: "domains",
  order: 9,
  lastUpdated: "2026-04-01",
  tags: ["plugin", "custom", "development", "extension"],
  readingTime: 9,
  body: `
## Custom Plugin Development

If none of the 16 built-in domains fits your material class, you can create a custom domain plugin. Plugins are standard Python packages that implement the \`DomainPlugin\` interface and register via entry points.

### Plugin Interface

Every domain plugin must implement the \`DomainPlugin\` abstract base class:

\`\`\`python
from materia.plugins import DomainPlugin
from materia.types import ParameterSpec, ObjectiveSpec, EvaluationResult

class MyDomain(DomainPlugin):
    """Custom domain for shape-memory alloy optimization."""

    @property
    def name(self) -> str:
        return "shape-memory-alloy"

    @property
    def description(self) -> str:
        return "NiTi shape memory alloy composition and processing"

    def default_parameters(self) -> list[ParameterSpec]:
        return [
            ParameterSpec(
                name="ni_content",
                type="continuous",
                bounds=(49.0, 51.5),
                unit="at%",
                description="Nickel content in atomic percent",
            ),
            ParameterSpec(
                name="aging_temp",
                type="integer",
                bounds=(300, 600),
                unit="C",
                description="Aging treatment temperature",
            ),
            ParameterSpec(
                name="aging_time",
                type="continuous",
                bounds=(0.5, 48.0),
                unit="hours",
                description="Aging treatment duration",
            ),
        ]

    def default_objectives(self) -> list[ObjectiveSpec]:
        return [
            ObjectiveSpec(
                name="transformation_temp",
                direction="maximize",
                unit="C",
            ),
            ObjectiveSpec(
                name="recoverable_strain",
                direction="maximize",
                unit="%",
            ),
        ]

    def evaluate(self, params: dict[str, float | int | str]) -> EvaluationResult:
        ni = params["ni_content"]
        aging_t = params["aging_temp"]
        aging_h = params["aging_time"]

        # Your physics model or ML prediction here
        transformation_temp = self._calc_transformation_temp(ni, aging_t, aging_h)
        strain = self._calc_recoverable_strain(ni, aging_t, aging_h)

        return EvaluationResult(
            objectives={
                "transformation_temp": transformation_temp,
                "recoverable_strain": strain,
            },
            metadata={
                "phase": "B2" if ni < 50.5 else "B19'",
            },
        )

    def validate(self, params: dict) -> list[str]:
        errors = []
        if params.get("ni_content", 50) < 49:
            errors.append("Ni content below minimum for shape memory effect")
        return errors
\`\`\`

### Project Structure

A plugin package has this structure:

\`\`\`
my-materia-plugin/
  pyproject.toml
  src/
    my_plugin/
      __init__.py
      domain.py          # DomainPlugin implementation
      physics.py          # Evaluation models
      components.yaml     # Default component data (optional)
  tests/
    test_domain.py
\`\`\`

### Registration via Entry Points

Register your domain in \`pyproject.toml\`:

\`\`\`toml
[project]
name = "materia-shape-memory"
version = "0.1.0"
dependencies = ["materia>=1.0"]

[project.entry-points."materia.domains"]
shape-memory-alloy = "my_plugin.domain:MyDomain"
\`\`\`

After installation (\`pip install -e .\`), your domain will be automatically discovered:

\`\`\`bash
materia init --list-domains
# Output includes: shape-memory-alloy  NiTi shape memory alloy composition and processing
\`\`\`

### The evaluate() Method

This is the core of your plugin. It receives a dictionary of parameter values and must return an \`EvaluationResult\` with objective values:

\`\`\`python
def evaluate(self, params: dict) -> EvaluationResult:
    # params = {"ni_content": 50.2, "aging_temp": 450, "aging_time": 12.0}

    # Option 1: Analytical model
    result = self.physics_model(params)

    # Option 2: Pre-trained ML model
    features = self.encode_features(params)
    result = self.ml_model.predict(features)

    # Option 3: External simulation call
    result = self.run_simulation(params)

    # Option 4: Experimental lookup (for closed-loop experiments)
    result = self.query_experiment_database(params)

    return EvaluationResult(objectives=result)
\`\`\`

### Validation Hook

The \`validate()\` method lets you add domain-specific validation rules:

\`\`\`python
def validate(self, params: dict) -> list[str]:
    errors = []
    if params.get("aging_temp", 0) > 500 and params.get("aging_time", 0) > 24:
        errors.append("Aging above 500C for >24h causes grain growth issues")
    return errors
\`\`\`

### Templates

Optionally provide templates that users can access via \`materia init --template\`:

\`\`\`python
def templates(self) -> dict[str, str]:
    return {
        "actuator": "templates/actuator.yaml",
        "biomedical": "templates/biomedical.yaml",
    }
\`\`\`

### Testing Your Plugin

Write tests to verify your evaluation function:

\`\`\`python
import pytest
from my_plugin.domain import MyDomain

def test_evaluation():
    domain = MyDomain()
    result = domain.evaluate({
        "ni_content": 50.5,
        "aging_temp": 450,
        "aging_time": 12.0,
    })
    assert "transformation_temp" in result.objectives
    assert "recoverable_strain" in result.objectives
    assert result.objectives["transformation_temp"] > 0

def test_validation():
    domain = MyDomain()
    errors = domain.validate({"ni_content": 48.0})
    assert len(errors) > 0
\`\`\`

### Publishing

Publish your plugin to PyPI so others can use it:

\`\`\`bash
pip install build twine
python -m build
twine upload dist/*
\`\`\`

Users install and use it:

\`\`\`bash
pip install materia-shape-memory
materia init my-sma --domain shape-memory-alloy
\`\`\`

### Best Practices

1. **Keep the evaluation function fast**: Aim for under 1 second per evaluation. If your physics model is slow, consider pre-computing a lookup table or training a fast surrogate offline.
2. **Return NaN for failed evaluations**: If a parameter combination is physically invalid, return NaN objectives rather than raising an exception.
3. **Include metadata**: Return auxiliary information (phase, microstructure, intermediate calculations) in the \`metadata\` field for post-hoc analysis.
4. **Document parameter ranges**: Provide clear descriptions and physically motivated bounds for all default parameters.
5. **Version your evaluation model**: If the physics model changes between plugin versions, users need to know which version produced their results.
`,
};

export default page;
