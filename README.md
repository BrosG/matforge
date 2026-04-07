# MATERIA - Materials Discovery Engine

Discover optimal materials through surrogate-assisted active learning and multi-objective Pareto optimization.

## Install

```bash
pip install materia
```

## Quick Start

```bash
# Initialize a project
materia init --domain water --name my_membrane

# Run discovery
materia run my_membrane/material.yaml --budget 500 --rounds 15

# View results
materia results --top 20
materia pareto --plot
materia dashboard
```

## Features

- **MDL (Material Definition Language)**: Declarative YAML format to describe any material design problem
- **Surrogate Models**: MLP neural network (NumPy-only) with MC Dropout uncertainty
- **Optimizers**: CMA-ES evolution strategy operating in normalized [0,1]^D space
- **Active Learning**: Automated sample-train-optimize-validate loop
- **Multi-Objective**: Native Pareto front computation (NSGA-II non-dominated sorting)
- **Domain Plugins**: Pre-configured templates for water, battery, solar, and more
- **Visualization**: Interactive HTML dashboard with Plotly.js
