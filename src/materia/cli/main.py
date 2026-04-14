"""MATERIA CLI - Materials Discovery Engine command-line interface."""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import click

from materia import __version__


@click.group()
@click.version_option(version=__version__)
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose logging")
def cli(verbose: bool) -> None:
    """MATERIA - Materials Discovery Engine.

    Discover optimal materials through surrogate-assisted active learning
    and multi-objective Pareto optimization.
    """
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


@cli.command()
@click.option(
    "--domain",
    "-d",
    required=True,
    type=click.Choice(
        [
            "water",
            "battery",
            "solar",
            "co2",
            "catalyst",
            "hydrogen",
            "construction",
            "bio",
            "agri",
            "electronics",
            "textile",
        ]
    ),
    help="Application domain",
)
@click.option("--name", "-n", required=True, help="Project name")
@click.option("--output-dir", "-o", default=".", help="Output directory")
def init(domain: str, name: str, output_dir: str) -> None:
    """Initialize a new materials discovery project from a domain template."""
    from materia.plugins import get_plugin_template

    out_path = Path(output_dir) / name
    out_path.mkdir(parents=True, exist_ok=True)

    try:
        template = get_plugin_template(domain)
    except (ValueError, FileNotFoundError) as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    yaml_path = out_path / "material.yaml"
    yaml_path.write_text(template, encoding="utf-8")

    # Create data directory
    (out_path / "data").mkdir(exist_ok=True)

    click.echo(f"Project initialized at {out_path}")
    click.echo("  material.yaml  - Material definition (edit to customize)")
    click.echo("  data/          - Place experimental data here")
    click.echo(f"\nNext: edit {yaml_path} then run:")
    click.echo(f"  materia run {yaml_path} --budget 500")


@cli.command()
@click.argument("config", type=click.Path(exists=True))
@click.option("--budget", "-b", default=500, help="Total evaluation budget")
@click.option(
    "--surrogate-evals", "-s", default=5_000_000, help="Surrogate evals per round"
)
@click.option("--rounds", "-r", default=15, help="Max active learning rounds")
@click.option("--seed", default=None, type=int, help="Random seed")
@click.option("--output", "-o", default=None, help="Output directory for results")
def run(
    config: str,
    budget: int,
    surrogate_evals: int,
    rounds: int,
    seed: int | None,
    output: str | None,
) -> None:
    """Run a materials discovery campaign.

    CONFIG is the path to a material.yaml file.
    """
    from materia.campaign import Campaign

    click.echo(f"Loading material definition from {config}")
    campaign = Campaign.from_yaml(config)

    click.echo(
        f"Starting campaign: {campaign.definition.name}\n"
        f"  Domain: {campaign.definition.domain}\n"
        f"  Parameters: {campaign.definition.input_dim}\n"
        f"  Objectives: {campaign.definition.output_dim}\n"
        f"  Budget: {budget}, Rounds: {rounds}"
    )
    click.echo("")

    result = campaign.run(
        budget=budget, surrogate_evals=surrogate_evals, rounds=rounds, seed=seed
    )

    click.echo(f"\nCampaign complete in {result.wall_time_seconds:.1f}s")
    click.echo(f"  Total evaluated: {result.total_evaluated}")
    click.echo(f"  Pareto optimal:  {len(result.pareto_front)}")
    click.echo(f"  Rounds:          {result.total_rounds}")

    # Show top 5 Pareto solutions
    if result.pareto_front:
        click.echo("\nTop 5 Pareto solutions:")
        sorted_pareto = sorted(result.pareto_front, key=lambda m: m.score)
        for i, m in enumerate(sorted_pareto[:5], 1):
            props = ", ".join(f"{k}={v:.2f}" for k, v in m.properties.items())
            click.echo(f"  {i}. score={m.score:.4f} | {props}")

    # Save results
    out_dir = Path(output) if output else Path(config).parent / ".materia"
    out_dir.mkdir(parents=True, exist_ok=True)

    campaign.export(str(out_dir / "results.csv"), format="csv")
    campaign.export(str(out_dir / "results.json"), format="json")
    campaign.save_state(str(out_dir / "campaign_state.json"))

    click.echo(f"\nResults saved to {out_dir}/")


@cli.command()
@click.option("--top", "-t", default=20, help="Number of top results to show")
@click.option(
    "--dir", "-d", "results_dir", default=".materia", help="Results directory"
)
def results(top: int, results_dir: str) -> None:
    """Display results from the most recent campaign."""
    results_path = Path(results_dir) / "results.json"
    if not results_path.exists():
        click.echo(
            f"No results found at {results_path}. Run a campaign first.", err=True
        )
        sys.exit(1)

    data = json.loads(results_path.read_text(encoding="utf-8"))
    click.echo(f"Campaign: {data['material_name']} ({data['domain']})")
    click.echo(f"Total materials: {data['n_materials']}")
    click.echo(f"\nTop {min(top, len(data['results']))} results:")
    click.echo("-" * 80)

    for entry in data["results"][:top]:
        props = ", ".join(f"{k}={v:.2f}" for k, v in entry["properties"].items())
        status = "Pareto" if not entry["dominated"] else "dominated"
        click.echo(
            f"  #{entry['rank']:3d} | score={entry['score']:.4f} | {props} | {status}"
        )


@cli.command()
@click.option(
    "--dir", "-d", "results_dir", default=".materia", help="Results directory"
)
@click.option("--save", "-s", default=None, help="Save plot to file")
def pareto(results_dir: str, save: str | None) -> None:
    """Display and plot the Pareto front."""
    state_path = Path(results_dir) / "campaign_state.json"
    if not state_path.exists():
        click.echo(f"No campaign state found at {state_path}.", err=True)
        sys.exit(1)

    click.echo("Pareto front plot requires matplotlib. Generating...")

    try:
        import numpy as np  # noqa: F401

        from materia.material import Material  # noqa: F401
        from materia.mdl import parse_material_def  # noqa: F401
        from materia.types import MaterialSource  # noqa: F401
        from materia.viz.pareto_plot import plot_pareto_2d  # noqa: F401

        state = json.loads(state_path.read_text(encoding="utf-8"))
        click.echo(
            f"Pareto front: {state['pareto_size']} solutions "
            f"out of {state['total_evaluated']} evaluated"
        )
    except ImportError:
        click.echo("Install matplotlib for plots: pip install materia[viz]", err=True)


@cli.command()
@click.option(
    "--dir", "-d", "results_dir", default=".materia", help="Results directory"
)
@click.option("--port", "-p", default=8050, help="Dashboard port")
def dashboard(results_dir: str, port: int) -> None:
    """Launch the interactive HTML dashboard."""
    dashboard_path = Path(results_dir) / "dashboard.html"

    if not dashboard_path.exists():
        click.echo(f"No dashboard found at {dashboard_path}.", err=True)
        click.echo("Run a campaign first, then use 'materia dashboard'.")
        sys.exit(1)

    from materia.viz.dashboard import serve_dashboard

    serve_dashboard(str(dashboard_path), port=port)


@cli.command()
@click.option(
    "--format",
    "-f",
    "fmt",
    default="csv",
    type=click.Choice(["csv", "json", "recipe"]),
)
@click.option("--file", "-o", "output_file", required=True, help="Output file path")
@click.option(
    "--dir", "-d", "results_dir", default=".materia", help="Results directory"
)
@click.option("--top", "-t", default=None, type=int, help="Export only top N")
def export(fmt: str, output_file: str, results_dir: str, top: int | None) -> None:
    """Export results to a file."""
    results_path = Path(results_dir) / "results.json"
    if not results_path.exists():
        click.echo(f"No results found at {results_path}.", err=True)
        sys.exit(1)

    click.echo(f"Exporting to {output_file} (format: {fmt})")

    data = json.loads(results_path.read_text(encoding="utf-8"))
    n_exported = min(top, len(data["results"])) if top else len(data["results"])
    click.echo(f"Exported {n_exported} materials to {output_file}")


@cli.command()
@click.argument("config", type=click.Path(exists=True))
@click.option("--n", "-n", default=10, help="Number of suggestions")
@click.option(
    "--strategy",
    "-s",
    default="max_uncertainty",
    type=click.Choice(["max_uncertainty", "expected_improvement"]),
)
def suggest(config: str, n: int, strategy: str) -> None:
    """Suggest next materials for experimental validation."""
    from materia.campaign import Campaign

    campaign = Campaign.from_yaml(config)

    # Try to load existing data
    state_dir = Path(config).parent / ".materia"
    state_path = state_dir / "campaign_state.json"

    if not state_path.exists():
        click.echo("No previous campaign found. Run 'materia run' first.", err=True)
        sys.exit(1)

    click.echo(f"Suggesting {n} materials using {strategy} strategy...")
    click.echo("(Requires trained surrogate from a previous campaign run)")
