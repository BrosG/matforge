"""Tests for health check endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestHealth:
    def test_liveness(self, client: TestClient):
        resp = client.get("/api/v1/health/live")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_health_alias(self, client: TestClient):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_info(self, client: TestClient):
        resp = client.get("/api/v1/info")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "MatCraft"
        assert "version" in data

    def test_root(self, client: TestClient):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "MatCraft"
        assert "docs" in data
