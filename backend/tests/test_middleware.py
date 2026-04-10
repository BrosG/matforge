"""Tests for custom middleware."""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestSecurityHeaders:
    def test_security_headers_present(self, client: TestClient):
        resp = client.get("/")
        assert resp.headers["X-Content-Type-Options"] == "nosniff"
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert resp.headers["X-XSS-Protection"] == "1; mode=block"
        assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
        assert "Permissions-Policy" in resp.headers
        assert resp.headers["Cache-Control"] == "no-store"


class TestRequestID:
    def test_response_has_request_id(self, client: TestClient):
        resp = client.get("/")
        assert "X-Request-ID" in resp.headers
        # Should be a valid UUID-like string
        assert len(resp.headers["X-Request-ID"]) > 10

    def test_custom_request_id_echoed(self, client: TestClient):
        resp = client.get("/", headers={"X-Request-ID": "custom-trace-123"})
        assert resp.headers["X-Request-ID"] == "custom-trace-123"


class TestCORS:
    def test_cors_preflight(self, client: TestClient):
        resp = client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Should allow the origin
        assert resp.status_code == 200
