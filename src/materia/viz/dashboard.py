"""HTML dashboard generation using Jinja2 with embedded Plotly.js."""

from __future__ import annotations

import json
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Optional, TYPE_CHECKING

from jinja2 import Template

from materia.material import Material
from materia.mdl import MaterialDef

if TYPE_CHECKING:
    from materia.active_learning.loop import RoundResult

DASHBOARD_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MATERIA Dashboard - {{ name }}</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
               background: #0f172a; color: #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e293b, #334155);
                  padding: 2rem; border-bottom: 1px solid #475569; }
        .header h1 { font-size: 1.8rem; color: #38bdf8; }
        .header p { color: #94a3b8; margin-top: 0.5rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                 gap: 1rem; padding: 1.5rem; }
        .stat-card { background: #1e293b; border-radius: 12px; padding: 1.5rem;
                     border: 1px solid #334155; }
        .stat-card .value { font-size: 2rem; font-weight: bold; color: #38bdf8; }
        .stat-card .label { color: #94a3b8; font-size: 0.9rem; margin-top: 0.25rem; }
        .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;
                  padding: 0 1.5rem 1.5rem; }
        .chart-card { background: #1e293b; border-radius: 12px; padding: 1.5rem;
                      border: 1px solid #334155; }
        .chart-card h3 { color: #f1f5f9; margin-bottom: 1rem; }
        .table-section { padding: 0 1.5rem 2rem; }
        .table-section h3 { color: #f1f5f9; margin-bottom: 1rem; }
        table { width: 100%; border-collapse: collapse; background: #1e293b;
                border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        th { background: #334155; padding: 0.75rem 1rem; text-align: left;
             font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; }
        td { padding: 0.75rem 1rem; border-top: 1px solid #334155; font-size: 0.9rem; }
        tr:hover td { background: #334155; }
        .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 9999px;
                 font-size: 0.75rem; font-weight: 600; }
        .badge-pareto { background: #065f46; color: #34d399; }
        .badge-dominated { background: #7f1d1d; color: #fca5a5; }
        @media (max-width: 768px) { .charts { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>MATERIA Dashboard</h1>
        <p>{{ name }} &mdash; {{ domain }} domain &mdash; {{ description }}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="value">{{ total_evaluated }}</div>
            <div class="label">Total Evaluated</div>
        </div>
        <div class="stat-card">
            <div class="value">{{ pareto_size }}</div>
            <div class="label">Pareto Optimal</div>
        </div>
        <div class="stat-card">
            <div class="value">{{ total_rounds }}</div>
            <div class="label">AL Rounds</div>
        </div>
        <div class="stat-card">
            <div class="value">{{ best_score }}</div>
            <div class="label">Best Score</div>
        </div>
    </div>

    <div class="charts">
        <div class="chart-card">
            <h3>Pareto Front</h3>
            <div id="pareto-chart"></div>
        </div>
        <div class="chart-card">
            <h3>Convergence</h3>
            <div id="convergence-chart"></div>
        </div>
    </div>

    <div class="table-section">
        <h3>Top Materials (Pareto Front)</h3>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Score</th>
                    {% for obj in objectives %}<th>{{ obj }}</th>{% endfor %}
                    <th>Source</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {% for m in top_materials %}
                <tr>
                    <td>{{ loop.index }}</td>
                    <td>{{ m.score }}</td>
                    {% for val in m.obj_values %}<td>{{ val }}</td>{% endfor %}
                    <td>{{ m.source }}</td>
                    <td><span class="badge {{ m.badge_class }}">{{ m.status }}</span></td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>

    <script>
        // Pareto plot
        var paretoData = {{ pareto_data | safe }};
        var dominatedData = {{ dominated_data | safe }};
        Plotly.newPlot('pareto-chart', [
            {x: dominatedData.x, y: dominatedData.y, mode: 'markers',
             marker: {color: '#475569', size: 5, opacity: 0.4}, name: 'Dominated', type: 'scatter'},
            {x: paretoData.x, y: paretoData.y, mode: 'markers+lines',
             marker: {color: '#f43f5e', size: 10}, line: {color: '#f43f5e', dash: 'dot'},
             name: 'Pareto Front', type: 'scatter'}
        ], {
            paper_bgcolor: '#1e293b', plot_bgcolor: '#1e293b',
            font: {color: '#94a3b8'},
            xaxis: {title: '{{ obj_x_label }}', gridcolor: '#334155'},
            yaxis: {title: '{{ obj_y_label }}', gridcolor: '#334155'},
            margin: {t: 20, r: 20}
        }, {responsive: true});

        // Convergence plot
        var convData = {{ convergence_data | safe }};
        Plotly.newPlot('convergence-chart', [
            {x: convData.rounds, y: convData.best_scores, mode: 'lines+markers',
             marker: {color: '#38bdf8', size: 6}, name: 'Best Score', type: 'scatter'}
        ], {
            paper_bgcolor: '#1e293b', plot_bgcolor: '#1e293b',
            font: {color: '#94a3b8'},
            xaxis: {title: 'Round', gridcolor: '#334155'},
            yaxis: {title: 'Best Score', gridcolor: '#334155'},
            margin: {t: 20, r: 20}
        }, {responsive: true});
    </script>
</body>
</html>"""


def generate_dashboard(
    materials: list[Material],
    material_def: MaterialDef,
    history: list[RoundResult],
    output_path: str = "dashboard.html",
) -> str:
    """Generate an interactive HTML dashboard."""
    pareto = sorted(
        [m for m in materials if not m.dominated],
        key=lambda m: m.score,
    )
    dominated = [m for m in materials if m.dominated]

    obj_names = [o.name for o in material_def.objectives]
    obj_x = obj_names[0] if obj_names else "obj_0"
    obj_y = obj_names[1] if len(obj_names) > 1 else obj_names[0] if obj_names else "obj_1"

    # Pareto scatter data
    pareto_data = {
        "x": [m.properties.get(obj_x, 0) for m in pareto],
        "y": [m.properties.get(obj_y, 0) for m in pareto],
    }
    dominated_data = {
        "x": [m.properties.get(obj_x, 0) for m in dominated],
        "y": [m.properties.get(obj_y, 0) for m in dominated],
    }

    # Convergence data
    convergence_data = {
        "rounds": [h.round_number for h in history],
        "best_scores": [round(h.best_score, 4) for h in history],
    }

    # Top materials table
    top_materials = []
    for m in pareto[:20]:
        top_materials.append({
            "score": round(m.score, 4),
            "obj_values": [round(m.properties.get(o, 0), 4) for o in obj_names],
            "source": m.source.value,
            "status": "Pareto" if not m.dominated else "Dominated",
            "badge_class": "badge-pareto" if not m.dominated else "badge-dominated",
        })

    obj_x_def = material_def.objectives[0] if material_def.objectives else None
    obj_y_def = material_def.objectives[1] if len(material_def.objectives) > 1 else obj_x_def

    template = Template(DASHBOARD_TEMPLATE)
    html = template.render(
        name=material_def.name,
        domain=material_def.domain,
        description=material_def.description or "",
        total_evaluated=len(materials),
        pareto_size=len(pareto),
        total_rounds=len(history),
        best_score=round(pareto[0].score, 4) if pareto else "N/A",
        objectives=obj_names,
        top_materials=top_materials,
        pareto_data=json.dumps(pareto_data),
        dominated_data=json.dumps(dominated_data),
        convergence_data=json.dumps(convergence_data),
        obj_x_label=f"{obj_x} ({obj_x_def.unit})" if obj_x_def and obj_x_def.unit else obj_x,
        obj_y_label=f"{obj_y} ({obj_y_def.unit})" if obj_y_def and obj_y_def.unit else obj_y,
    )

    Path(output_path).write_text(html, encoding="utf-8")
    return output_path


def serve_dashboard(
    path: str = "dashboard.html", port: int = 8050
) -> None:
    """Serve the dashboard HTML file via a simple HTTP server."""
    dashboard_path = Path(path).resolve()
    if not dashboard_path.exists():
        raise FileNotFoundError(f"Dashboard not found: {path}")

    directory = str(dashboard_path.parent)

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args: object, **kwargs: object) -> None:
            super().__init__(*args, directory=directory, **kwargs)  # type: ignore[arg-type]

    print(f"Serving dashboard at http://localhost:{port}/{dashboard_path.name}")
    webbrowser.open(f"http://localhost:{port}/{dashboard_path.name}")

    server = HTTPServer(("", port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard server stopped.")
        server.server_close()
