import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "what-domains-supported",
    question: "What material domains does MatCraft support?",
    answer: `MatCraft ships with 16 built-in material domain plugins, each providing pre-configured parameter schemas, physics models, and validation rules specific to that material class. You can also create custom domains for materials not covered by the built-in plugins.

## Built-In Domains

| Domain | Key Parameters | Typical Objectives |
|--------|---------------|-------------------|
| **Water Membranes** | Polymer type, concentration, additives, pore size | Water flux, salt rejection, fouling resistance |
| **Lithium-Ion Batteries** | Cathode composition (NMC ratios), electrolyte, coating | Capacity, cycle life, rate capability |
| **Sodium-Ion Batteries** | Cathode chemistry, electrolyte formulation | Capacity, voltage, cycle stability |
| **Perovskite Solar Cells** | A/B/X-site composition, layer thicknesses | Power conversion efficiency, stability |
| **Silicon Solar Cells** | Doping profiles, texturing, anti-reflection coating | Efficiency, cost per watt |
| **Thermoelectrics** | Carrier concentration, alloying fractions | ZT (figure of merit), power factor |
| **Catalysts** | Metal loadings, support material, promoters | Activity, selectivity, stability |
| **Polymer Composites** | Matrix resin, filler type and loading, fiber orientation | Tensile strength, modulus, impact resistance |
| **Ceramic Coatings** | Composition, deposition temperature, thickness | Hardness, thermal conductivity, adhesion |
| **Alloys** | Elemental fractions, heat treatment parameters | Yield strength, ductility, corrosion resistance |
| **Superconductors** | Elemental ratios, doping levels | Critical temperature (Tc), critical current |
| **Magnetic Materials** | Rare earth content, microstructure parameters | Coercivity, remanence, energy product |
| **Optical Films** | Layer compositions, thicknesses | Transmittance, reflectance, bandwidth |
| **Biomaterials** | Polymer blend ratios, crosslinker, growth factors | Biocompatibility, degradation rate, mechanical properties |
| **Concrete & Cement** | Cement type, aggregate ratio, admixtures | Compressive strength, workability, CO2 footprint |
| **Electronic Packaging** | Solder composition, underfill, substrate | Thermal conductivity, CTE match, reliability |

## Using a Domain Plugin

Specify the domain in your material YAML to activate domain-specific features:

\`\`\`yaml
domain: battery
\`\`\`

This enables automatic parameter validation (e.g., ensuring NMC fractions sum to 1.0), domain-specific physics models for fast approximate evaluation, and curated default parameter ranges based on published literature.

## Custom Domains

If your material is not covered, you can define a custom domain or use the generic \`custom\` domain with no built-in physics. See the "How to create a custom domain" FAQ for details.`,
    category: "domains",
    order: 0,
    relatedSlugs: ["how-to-create-custom-domain", "water-membrane-optimization"],
    tags: ["domains", "materials", "plugins"],
  },
  {
    slug: "water-membrane-optimization",
    question: "How do I optimize water purification membranes with MatCraft?",
    answer: `The water membrane domain is one of MatCraft's most mature plugins. It supports optimization of polymeric membranes for reverse osmosis (RO), nanofiltration (NF), and ultrafiltration (UF) applications.

## Quick Start

\`\`\`yaml
name: "ro-membrane-study"
domain: water_membrane

components:
  - name: polymer_concentration
    type: continuous
    bounds: [0.10, 0.35]
    unit: "wt%"
    description: "Polymer (PSf/PES/PVDF) concentration in casting solution"
  - name: additive_type
    type: categorical
    choices: ["PVP", "PEG", "LiCl", "ZnCl2", "none"]
  - name: additive_concentration
    type: continuous
    bounds: [0.0, 0.15]
    unit: "wt%"
  - name: coagulation_bath_temp
    type: continuous
    bounds: [15, 60]
    unit: "°C"
  - name: evaporation_time
    type: continuous
    bounds: [0, 120]
    unit: "seconds"

objectives:
  - name: water_flux
    direction: maximize
    unit: "L/m²/h"
  - name: salt_rejection
    direction: maximize
    unit: "%"
  - name: fouling_resistance
    direction: maximize
    unit: "FRR%"
    description: "Flux recovery ratio after BSA fouling"

constraints:
  - type: custom
    expression: "salt_rejection >= 90.0"
    description: "Minimum acceptable rejection for RO"
\`\`\`

## Built-In Physics Model

The water membrane plugin includes a simplified transport model based on the solution-diffusion framework:

- **Water flux** is estimated using the Hagen-Poiseuille equation with porosity and pore size derived from polymer concentration and additive effects.
- **Salt rejection** is modeled using the Kedem-Katchalsky equation, accounting for membrane thickness and charge effects.
- **Fouling resistance** uses empirical correlations based on surface hydrophilicity (influenced by additive type).

These physics models provide approximate evaluations for surrogate training when you do not have experimental data for every candidate. They are calibrated against published literature data for common PSf/PES systems.

## Typical Results

In our benchmarks with PSf membranes, MatCraft found Pareto-optimal compositions that matched or exceeded manually optimized formulations from the literature within 12 iterations (60 total evaluations including 20 seed points). The key insight from the optimization was a non-obvious interaction between additive concentration and coagulation temperature that was not captured by one-variable-at-a-time experiments.

## Experimental Workflow

For lab-based optimization, set the evaluator to \`manual\` mode. MatCraft will suggest 5 compositions per iteration, you fabricate and test them, enter the results, and the next iteration refines the search.`,
    category: "domains",
    order: 1,
    relatedSlugs: ["what-domains-supported", "what-is-pareto-front", "custom-objective-functions"],
    tags: ["water", "membrane", "filtration"],
  },
  {
    slug: "battery-material-design",
    question: "How do I design battery materials with MatCraft?",
    answer: `MatCraft's battery domain plugin supports optimization of cathode compositions, electrolyte formulations, and electrode architectures for lithium-ion and sodium-ion batteries.

## Cathode Composition Optimization (NMC)

The most common use case is optimizing Ni-Mn-Co ratios in layered oxide cathodes:

\`\`\`yaml
name: "nmc-cathode-opt"
domain: battery

components:
  - name: nickel_fraction
    type: continuous
    bounds: [0.33, 0.95]
    description: "Ni molar fraction"
  - name: manganese_fraction
    type: continuous
    bounds: [0.025, 0.34]
  - name: cobalt_fraction
    type: continuous
    bounds: [0.025, 0.34]
  - name: coating_thickness
    type: continuous
    bounds: [0.5, 15.0]
    unit: "nm"
    description: "Al2O3 surface coating thickness"
  - name: calcination_temp
    type: continuous
    bounds: [700, 900]
    unit: "°C"

constraints:
  - type: sum_equals
    components: [nickel_fraction, manganese_fraction, cobalt_fraction]
    value: 1.0

objectives:
  - name: specific_capacity
    direction: maximize
    unit: "mAh/g"
  - name: capacity_retention_500
    direction: maximize
    unit: "%"
    description: "Capacity retention after 500 cycles at 1C"
  - name: cobalt_content
    direction: minimize
    description: "Minimize cobalt for cost and ethics"
\`\`\`

## Built-In Physics

The battery plugin includes:

- **Thermodynamic model**: Predicts theoretical capacity from composition using ionic radii and oxidation state analysis.
- **Empirical cycle life model**: Estimates capacity fade based on Ni content (higher Ni = faster degradation) and coating thickness (thicker coating = slower degradation but lower initial capacity).
- **Cost model**: Calculates raw material cost per kg based on current commodity prices for Ni, Mn, and Co.

## Electrolyte Optimization

\`\`\`yaml
domain: battery
components:
  - name: ec_fraction
    type: continuous
    bounds: [0.1, 0.5]
    description: "Ethylene carbonate volume fraction"
  - name: dmc_fraction
    type: continuous
    bounds: [0.2, 0.7]
  - name: emc_fraction
    type: continuous
    bounds: [0.0, 0.5]
  - name: lipf6_concentration
    type: continuous
    bounds: [0.8, 1.5]
    unit: "mol/L"
  - name: vc_additive
    type: continuous
    bounds: [0.0, 0.05]
    description: "Vinylene carbonate additive fraction"

constraints:
  - type: sum_equals
    components: [ec_fraction, dmc_fraction, emc_fraction]
    value: 1.0

objectives:
  - name: ionic_conductivity
    direction: maximize
    unit: "mS/cm"
  - name: electrochemical_window
    direction: maximize
    unit: "V"
\`\`\`

## Integration with DFT

For high-fidelity evaluations, MatCraft can wrap DFT codes (VASP, Quantum ESPRESSO) as external evaluators. The surrogate model learns from DFT results and reduces the total number of expensive calculations needed by 5-10x compared to brute-force screening.`,
    category: "domains",
    order: 2,
    relatedSlugs: ["what-domains-supported", "custom-objective-functions"],
    tags: ["battery", "cathode", "electrolyte", "lithium-ion"],
  },
  {
    slug: "solar-cell-optimization",
    question: "How do I optimize solar cell materials with MatCraft?",
    answer: `MatCraft supports optimization of both perovskite and silicon solar cells. The solar cell domain plugin provides physics models for predicting power conversion efficiency and stability from material parameters.

## Perovskite Solar Cells

Perovskite absorbers have the general formula ABX3, where A, B, and X site compositions dramatically affect performance:

\`\`\`yaml
name: "perovskite-absorber"
domain: solar_cell

components:
  - name: ma_fraction
    type: continuous
    bounds: [0.0, 1.0]
    description: "Methylammonium (MA) fraction on A-site"
  - name: fa_fraction
    type: continuous
    bounds: [0.0, 1.0]
    description: "Formamidinium (FA) fraction on A-site"
  - name: cs_fraction
    type: continuous
    bounds: [0.0, 0.2]
    description: "Cesium fraction on A-site"
  - name: pb_fraction
    type: continuous
    bounds: [0.5, 1.0]
    description: "Lead fraction on B-site"
  - name: sn_fraction
    type: continuous
    bounds: [0.0, 0.5]
    description: "Tin fraction on B-site"
  - name: iodide_fraction
    type: continuous
    bounds: [0.5, 1.0]
    description: "Iodide fraction on X-site"
  - name: bromide_fraction
    type: continuous
    bounds: [0.0, 0.5]
  - name: absorber_thickness
    type: continuous
    bounds: [200, 800]
    unit: "nm"

constraints:
  - type: sum_equals
    components: [ma_fraction, fa_fraction, cs_fraction]
    value: 1.0
  - type: sum_equals
    components: [pb_fraction, sn_fraction]
    value: 1.0
  - type: sum_equals
    components: [iodide_fraction, bromide_fraction]
    value: 1.0

objectives:
  - name: pce
    direction: maximize
    unit: "%"
    description: "Power conversion efficiency"
  - name: stability_t80
    direction: maximize
    unit: "hours"
    description: "Time to 80% of initial efficiency under 1-sun illumination"
  - name: bandgap
    direction: minimize
    description: "Deviation from Shockley-Queisser optimal bandgap (1.34 eV)"
\`\`\`

## Built-In Physics

The solar cell plugin includes:

- **Bandgap estimation**: Vegard's law interpolation from end-member bandgaps, accounting for bowing parameters for mixed compositions.
- **Shockley-Queisser limit**: Theoretical maximum efficiency as a function of bandgap.
- **Stability heuristic**: Empirical model based on Goldschmidt tolerance factor and octahedral factor -- compositions with tolerance factors closer to 1.0 are predicted to be more stable.
- **Absorption coefficient model**: Estimates absorption edge and Urbach energy from composition.

## Typical Campaign

A perovskite optimization campaign with 8 parameters typically converges in 15-20 iterations. The Pareto front between efficiency and stability reveals the fundamental trade-off: Sn-rich compositions can achieve high efficiency but suffer from rapid oxidation, while Cs-containing compositions are more stable but have wider bandgaps.

## Silicon Solar Cells

For silicon cells, the domain covers doping profiles, surface texturing parameters, anti-reflection coating thickness, and metallization geometry. The physics model uses a simplified PC1D-style simulation for rapid efficiency estimation.`,
    category: "domains",
    order: 3,
    relatedSlugs: ["what-domains-supported", "what-is-pareto-front"],
    tags: ["solar", "perovskite", "photovoltaic"],
  },
  {
    slug: "how-to-create-custom-domain",
    question: "How do I create a custom material domain?",
    answer: `If your material is not covered by MatCraft's 16 built-in domains, you can create a custom domain plugin. A domain plugin consists of a YAML schema definition and an optional Python physics module.

## Minimal Custom Domain

At minimum, a domain is a YAML file defining the parameter schema:

\`\`\`yaml
# plugins/my_domain/components.yaml
domain_name: shape_memory_alloy
description: "NiTi-based shape memory alloys"
version: "1.0.0"

default_components:
  - name: nickel_content
    type: continuous
    bounds: [49.0, 51.5]
    unit: "at%"
    description: "Nickel atomic percentage"
  - name: aging_temperature
    type: continuous
    bounds: [300, 600]
    unit: "°C"
  - name: aging_time
    type: continuous
    bounds: [0.5, 48]
    unit: "hours"
  - name: cold_work
    type: continuous
    bounds: [0, 40]
    unit: "%"

default_objectives:
  - name: transformation_temperature
    direction: maximize
    unit: "°C"
    description: "Austenite finish temperature (Af)"
  - name: recoverable_strain
    direction: maximize
    unit: "%"
  - name: fatigue_life
    direction: maximize
    unit: "cycles"

default_constraints:
  - type: custom
    expression: "nickel_content >= 49.5 and nickel_content <= 51.0"
    description: "Near-equiatomic NiTi range for shape memory effect"
\`\`\`

## Adding a Physics Model

Create a Python file with evaluation functions:

\`\`\`python
# plugins/my_domain/physics.py
from materia.evaluate import DomainPhysics

class ShapeMemoryAlloyPhysics(DomainPhysics):
    """Physics model for NiTi shape memory alloys."""

    def evaluate(self, composition: dict) -> dict:
        ni = composition["nickel_content"]
        t_age = composition["aging_temperature"]
        t_time = composition["aging_time"]
        cw = composition["cold_work"]

        # Empirical model for transformation temperature
        # Based on Frenzel et al. (2010) correlations
        af = -1450 + 28.5 * ni + 0.02 * t_age * t_time - 0.5 * cw

        # Recoverable strain model
        strain = 8.0 - 0.15 * abs(ni - 50.5) - 0.01 * cw

        # Fatigue life (log-linear model)
        import math
        fatigue = math.exp(10 - 0.5 * abs(ni - 50.0) + 0.01 * t_age - 0.02 * cw)

        return {
            "transformation_temperature": af,
            "recoverable_strain": max(0, strain),
            "fatigue_life": fatigue,
        }
\`\`\`

## Registering the Plugin

Place your files in the plugin directory and register them:

\`\`\`bash
materia plugin register ./plugins/my_domain/
\`\`\`

Or in Python:

\`\`\`python
from materia.plugins import register_domain
register_domain("./plugins/my_domain/")
\`\`\`

## Using Your Custom Domain

\`\`\`yaml
domain: shape_memory_alloy  # References your registered plugin
name: "niti-optimization"
# Components and objectives inherit from plugin defaults
# Override or add additional parameters as needed
components:
  - name: ternary_element
    type: categorical
    choices: ["Cu", "Fe", "Nb", "none"]
\`\`\`

## Best Practices

- Start with published empirical correlations for your physics model, even if approximate. The surrogate will learn corrections from real data.
- Include sensible default bounds based on literature. Users can always override them.
- Add input validation to catch physically impossible combinations early.
- Write unit tests for your physics model to catch regressions.`,
    category: "domains",
    order: 4,
    relatedSlugs: ["what-domains-supported", "adding-physics-models"],
    tags: ["custom", "domain", "plugin"],
  },
  {
    slug: "adding-physics-models",
    question: "How do I add custom physics models to a domain?",
    answer: `Physics models in MatCraft serve as fast approximate evaluators that supplement or replace experimental data during optimization. They are particularly valuable for generating initial training data for the surrogate model.

## Physics Model Architecture

A physics model inherits from \`DomainPhysics\` and implements the \`evaluate\` method:

\`\`\`python
from materia.evaluate import DomainPhysics
import numpy as np

class MyPhysicsModel(DomainPhysics):
    """Custom physics model for thermal barrier coatings."""

    def __init__(self, temperature: float = 1000.0):
        super().__init__()
        self.operating_temp = temperature  # Service temperature in °C

    def evaluate(self, composition: dict) -> dict:
        ysz_fraction = composition["ysz_fraction"]
        alumina_fraction = composition["alumina_fraction"]
        thickness = composition["coating_thickness"]
        porosity = composition["porosity"]

        # Thermal conductivity (Maxwell-Eucken model)
        k_dense = 2.5 * ysz_fraction + 30.0 * alumina_fraction
        k_eff = k_dense * (1 - porosity) / (1 + 0.5 * porosity)

        # Thermal resistance
        r_thermal = thickness * 1e-6 / k_eff  # m²·K/W

        # Thermal stress (simplified Timoshenko)
        delta_t = self.operating_temp - 25.0
        cte_mismatch = abs(10e-6 * ysz_fraction - 12e-6 * alumina_fraction)
        thermal_stress = cte_mismatch * delta_t * 200e9 * thickness * 1e-6

        # Erosion resistance (empirical)
        erosion_rate = 0.1 / (ysz_fraction * thickness * (1 - porosity) + 0.01)

        return {
            "thermal_resistance": r_thermal,
            "thermal_stress": thermal_stress,
            "erosion_rate": erosion_rate,
        }

    def validate_inputs(self, composition: dict) -> list[str]:
        """Optional: return list of validation warnings."""
        warnings = []
        if composition.get("porosity", 0) > 0.3:
            warnings.append("Porosity > 30% may compromise structural integrity")
        return warnings
\`\`\`

## Wrapping External Simulation Codes

If you have an existing simulation tool (COMSOL, LAMMPS, VASP, etc.), wrap it as a physics model:

\`\`\`python
import subprocess
import json
from materia.evaluate import DomainPhysics

class COMSOLWrapper(DomainPhysics):
    def __init__(self, comsol_path: str, model_file: str):
        super().__init__()
        self.comsol_path = comsol_path
        self.model_file = model_file

    def evaluate(self, composition: dict) -> dict:
        # Write input parameters
        with open("/tmp/comsol_input.json", "w") as f:
            json.dump(composition, f)

        # Run COMSOL in batch mode
        result = subprocess.run(
            [self.comsol_path, "batch", "-inputfile", self.model_file,
             "-paramfile", "/tmp/comsol_input.json",
             "-outputfile", "/tmp/comsol_output.json"],
            capture_output=True, text=True, timeout=3600
        )

        if result.returncode != 0:
            raise RuntimeError(f"COMSOL failed: {result.stderr}")

        with open("/tmp/comsol_output.json") as f:
            return json.load(f)
\`\`\`

## Hybrid Evaluation

MatCraft supports a hybrid approach where fast physics models provide most evaluations, and expensive simulations or experiments are used selectively:

\`\`\`python
campaign = Campaign(
    material=material,
    evaluator=MyPhysicsModel(),          # Fast approximate model
    validation_evaluator=COMSOLWrapper(),  # Expensive high-fidelity model
    validation_frequency=5,  # Validate every 5th candidate with COMSOL
)
\`\`\`

This two-tier approach gives you the speed of approximate models with periodic ground-truth validation.`,
    category: "domains",
    order: 5,
    relatedSlugs: ["how-to-create-custom-domain", "custom-objective-functions"],
    tags: ["physics", "simulation", "evaluator"],
  },
  {
    slug: "domain-parameters-explained",
    question: "How do material domain parameters work?",
    answer: `Domain parameters define the search space for your optimization campaign. Understanding parameter types, bounds, and constraints is essential for setting up an effective campaign.

## Parameter Types

MatCraft supports three parameter types:

### Continuous

Real-valued parameters with lower and upper bounds. This is the most common type.

\`\`\`yaml
- name: temperature
  type: continuous
  bounds: [200, 800]
  unit: "°C"
\`\`\`

The optimizer searches the continuous range between the bounds. CMA-ES handles continuous parameters natively.

### Discrete

Integer-valued parameters or parameters that can only take specific numeric steps:

\`\`\`yaml
- name: num_layers
  type: discrete
  bounds: [1, 10]
  step: 1  # Optional, defaults to 1

- name: concentration
  type: discrete
  bounds: [0.1, 1.0]
  step: 0.1  # Only values 0.1, 0.2, ..., 1.0
\`\`\`

Discrete parameters are handled by rounding the continuous CMA-ES output to the nearest valid step.

### Categorical

Parameters that take one of a fixed set of non-numeric values:

\`\`\`yaml
- name: solvent
  type: categorical
  choices: ["DMF", "DMSO", "NMP", "DMAc"]
\`\`\`

Categorical parameters are encoded using one-hot encoding internally. For k categories, this adds k-1 dimensions to the search space (one category is treated as the reference).

## Bounds

Bounds define the range of valid values. For best results:

- Set bounds based on **physically feasible** ranges, not just the range of your existing data.
- Wider bounds give the optimizer more room to explore but may slow convergence.
- If you know the optimum is in a specific region, tighten the bounds accordingly.

\`\`\`yaml
# Too tight -- may miss the optimum
bounds: [0.48, 0.52]

# Too wide -- wastes evaluations on infeasible regions
bounds: [0.0, 1.0]

# Good -- covers the feasible range based on domain knowledge
bounds: [0.3, 0.7]
\`\`\`

## Units

Units are metadata -- they do not affect the optimization. They are displayed in results and visualizations for clarity:

\`\`\`yaml
- name: pressure
  bounds: [1, 100]
  unit: "bar"
\`\`\`

## Default Values

You can specify a default or initial value that the optimizer uses as a starting point:

\`\`\`yaml
- name: temperature
  bounds: [200, 800]
  default: 450  # CMA-ES will center initial distribution here
\`\`\`

## Parameter Scaling

MatCraft automatically normalizes all parameters to [0, 1] internally for the optimizer. This ensures that parameters with different magnitudes (e.g., temperature in hundreds of degrees vs. concentration in fractional percentages) are treated equally. You do not need to manually scale your parameters.`,
    category: "domains",
    order: 6,
    relatedSlugs: ["how-to-write-yaml-config", "domain-constraints-guide"],
    tags: ["parameters", "bounds", "types"],
  },
  {
    slug: "domain-constraints-guide",
    question: "How do I define constraints for my material optimization?",
    answer: `Constraints ensure that the optimizer only proposes physically valid and feasible compositions. MatCraft supports several constraint types.

## Sum Constraints

The most common constraint in materials science -- component fractions must sum to a fixed value:

\`\`\`yaml
constraints:
  - type: sum_equals
    components: [nickel, manganese, cobalt]
    value: 1.0
    tolerance: 0.001  # Allow 0.1% deviation

  - type: sum_lte
    components: [filler_a, filler_b, filler_c]
    value: 0.4
    description: "Total filler loading must not exceed 40%"
\`\`\`

## Ratio Constraints

Specify that the ratio between two parameters must fall within a range:

\`\`\`yaml
constraints:
  - type: ratio_between
    numerator: nickel
    denominator: cobalt
    bounds: [2.0, 10.0]
    description: "Ni:Co ratio must be between 2:1 and 10:1"
\`\`\`

## Inequality Constraints

General linear or nonlinear inequality constraints:

\`\`\`yaml
constraints:
  - type: custom
    expression: "temperature * pressure <= 50000"
    description: "Equipment safety limit"

  - type: custom
    expression: "polymer_concentration >= 2 * additive_concentration"
    description: "Polymer must be at least 2x the additive"
\`\`\`

## Categorical Constraints

Conditional constraints that depend on categorical parameter values:

\`\`\`yaml
constraints:
  - type: conditional
    condition: "solvent == 'DMSO'"
    constraint:
      type: custom
      expression: "temperature <= 189"
      description: "DMSO boiling point limit"
\`\`\`

## How Constraints Are Enforced

MatCraft enforces constraints at two levels:

### 1. Repair Operator (During Optimization)

When CMA-ES generates a candidate that violates a constraint, a repair operator projects it back to the feasible region:

- **Sum constraints**: Components are rescaled proportionally to satisfy the sum.
- **Bound constraints**: Values are clamped to bounds.
- **Custom constraints**: Candidates are rejected and resampled.

### 2. Validation (During Data Import)

When importing experimental data, constraint violations are reported as warnings but data is not rejected. Real measurements may legitimately deviate from target constraints due to experimental error.

## Common Patterns

### Composition Simplex

For materials where all components must sum to exactly 1.0:

\`\`\`yaml
constraints:
  - type: sum_equals
    components: [comp_a, comp_b, comp_c, comp_d]
    value: 1.0
\`\`\`

MatCraft uses a simplex projection to handle this efficiently -- internally reducing the dimensionality by one.

### Nested Constraints

\`\`\`yaml
constraints:
  - type: sum_equals
    components: [ni, mn, co]
    value: 1.0
  - type: custom
    expression: "ni >= 0.33"
    description: "Minimum Ni content for high-energy cathode"
  - type: custom
    expression: "co <= 0.2"
    description: "Cap cobalt for cost reduction"
\`\`\`

## Debugging Constraints

Use the CLI to check if your constraint set is feasible:

\`\`\`bash
materia config check-constraints my_material.yaml --samples 10000
\`\`\`

This generates 10,000 random compositions and reports what fraction satisfy all constraints. If the feasible fraction is below 1%, your constraints may be too tight.`,
    category: "domains",
    order: 7,
    relatedSlugs: ["domain-parameters-explained", "how-to-write-yaml-config"],
    tags: ["constraints", "validation", "feasibility"],
  },
];

export default faqs;
