"""Start Celery worker with an HTTP health endpoint for Cloud Run."""

import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import os


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, format, *args):
        pass


def main():
    port = int(os.environ.get("PORT", "8080"))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"Health server listening on port {port}")

    subprocess.run([
        "celery", "-A", "app.tasks.celery_app", "worker",
        "--loglevel=info",
        "--queues=default,campaigns",
        "--concurrency=2",
    ])


if __name__ == "__main__":
    main()
