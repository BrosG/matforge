"""Tests for the CLI."""

from click.testing import CliRunner
from materia.cli.main import cli


def test_cli_version():
    runner = CliRunner()
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "0.1.0" in result.output


def test_cli_help():
    runner = CliRunner()
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    assert "MATERIA" in result.output


def test_cli_init_water(tmp_path):
    runner = CliRunner()
    result = runner.invoke(cli, [
        "init", "--domain", "water", "--name", "test_project",
        "--output-dir", str(tmp_path),
    ])
    assert result.exit_code == 0
    assert "Project initialized" in result.output

    yaml_path = tmp_path / "test_project" / "material.yaml"
    assert yaml_path.exists()

    content = yaml_path.read_text(encoding="utf-8")
    assert "water" in content
    assert "pore_diameter" in content


def test_cli_results_no_data(tmp_path):
    runner = CliRunner()
    result = runner.invoke(cli, ["results", "--dir", str(tmp_path)])
    assert result.exit_code != 0
