"""Tests for user authentication and management endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.db.models import User


class TestRegister:
    def test_register_success(self, client: TestClient):
        resp = client.post("/api/v1/users/register", json={
            "email": "new@matcraft.dev",
            "password": "securepassword123",
            "full_name": "New User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        resp = client.post("/api/v1/users/register", json={
            "email": test_user.email,
            "password": "anotherpassword1",
        })
        assert resp.status_code == 409

    def test_register_short_password(self, client: TestClient):
        resp = client.post("/api/v1/users/register", json={
            "email": "short@matcraft.dev",
            "password": "123",
        })
        assert resp.status_code == 400


class TestLogin:
    def test_login_success(self, client: TestClient, test_user: User):
        resp = client.post("/api/v1/users/login", json={
            "email": "test@matcraft.dev",
            "password": "testpassword123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_wrong_password(self, client: TestClient, test_user: User):
        resp = client.post("/api/v1/users/login", json={
            "email": "test@matcraft.dev",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client: TestClient):
        resp = client.post("/api/v1/users/login", json={
            "email": "ghost@matcraft.dev",
            "password": "anything",
        })
        assert resp.status_code == 401


class TestMe:
    def test_get_me(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/v1/users/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@matcraft.dev"
        assert data["full_name"] == "Test User"
        assert data["is_admin"] is False

    def test_get_me_no_auth(self, client: TestClient):
        resp = client.get("/api/v1/users/me")
        assert resp.status_code in (401, 403)

    def test_update_profile(self, client: TestClient, auth_headers: dict):
        resp = client.patch("/api/v1/users/me", headers=auth_headers, json={
            "full_name": "Updated Name",
        })
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Name"


class TestGuest:
    def test_guest_login(self, client: TestClient):
        resp = client.post("/api/v1/users/guest")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_guest_login_idempotent(self, client: TestClient):
        r1 = client.post("/api/v1/users/guest")
        r2 = client.post("/api/v1/users/guest")
        assert r1.status_code == 200
        assert r2.status_code == 200


class TestRefresh:
    def test_refresh_token(self, client: TestClient, test_user: User):
        login = client.post("/api/v1/users/login", json={
            "email": "test@matcraft.dev",
            "password": "testpassword123",
        })
        refresh = login.json()["refresh_token"]
        resp = client.post("/api/v1/users/refresh", json={
            "refresh_token": refresh,
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_with_access_token_fails(self, client: TestClient, test_user: User):
        login = client.post("/api/v1/users/login", json={
            "email": "test@matcraft.dev",
            "password": "testpassword123",
        })
        access = login.json()["access_token"]
        resp = client.post("/api/v1/users/refresh", json={
            "refresh_token": access,
        })
        assert resp.status_code == 401


class TestValidateToken:
    def test_valid_token(self, client: TestClient, auth_headers: dict):
        resp = client.post("/api/v1/users/validate-token", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["valid"] is True

    def test_invalid_token(self, client: TestClient):
        resp = client.post(
            "/api/v1/users/validate-token",
            headers={"Authorization": "Bearer garbage"},
        )
        assert resp.status_code == 401
