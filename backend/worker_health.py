"""Minimal health server for Cloud Run worker.

Cloud Run requires a listening port even for non-HTTP services like
Celery workers. This starts a tiny HTTP server in a background thread
that responds to health checks.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import threading


class _HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, format, *args):
        pass  # Suppress request logging


def start_health_server(port: int = 8080) -> None:
    """Start the health check server in a daemon thread."""
    server = HTTPServer(("0.0.0.0", port), _HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
