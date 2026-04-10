"""Tests for template marketplace endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Template, User
SAMPLE_YAML = """\
name: test_material
domain: test
parameters:
  - name: x
    range: [0, 10]
  - name: y
    range: [0, 10]
objectives:
  - name: f1
    direction: minimize
  - name: f2
    direction: maximize
"""


def _create_template(db: Session, author: User, **kwargs) -> Template:
    defaults = {
        "name": "Test Template",
        "domain": "test",
        "definition_yaml": SAMPLE_YAML,
        "author_id": author.id,
        "tags": ["test"],
    }
    defaults.update(kwargs)
    t = Template(**defaults)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


class TestCreateTemplate:
    def test_create_success(self, client: TestClient, auth_headers: dict):
        resp = client.post("/api/v1/templates", headers=auth_headers, json={
            "name": "Water Filter",
            "domain": "water",
            "definition_yaml": SAMPLE_YAML,
            "tags": ["water", "membrane"],
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Water Filter"
        assert data["tags"] == ["water", "membrane"]
        assert data["likes_count"] == 0

    def test_create_no_auth(self, client: TestClient):
        resp = client.post("/api/v1/templates", json={
            "name": "No Auth",
            "domain": "test",
            "definition_yaml": SAMPLE_YAML,
        })
        assert resp.status_code in (401, 403)


class TestListTemplates:
    def test_list(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        _create_template(db_session, test_user, name="T1")
        _create_template(db_session, test_user, name="T2")
        resp = client.get("/api/v1/templates", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 2


class TestLikeTemplate:
    def test_toggle_like(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        t = _create_template(db_session, test_user)
        # Like
        resp = client.post(f"/api/v1/templates/{t.id}/like", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["liked"] is True
        assert resp.json()["likes_count"] == 1
        # Unlike
        resp = client.post(f"/api/v1/templates/{t.id}/like", headers=auth_headers)
        assert resp.json()["liked"] is False
        assert resp.json()["likes_count"] == 0


class TestForkTemplate:
    def test_fork(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        t = _create_template(db_session, test_user)
        resp = client.post(f"/api/v1/templates/{t.id}/fork", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "campaign_id" in data
        assert data["template_id"] == t.id


class TestDeleteTemplate:
    def test_delete_own(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        t = _create_template(db_session, test_user)
        resp = client.delete(f"/api/v1/templates/{t.id}", headers=auth_headers)
        assert resp.status_code == 204

    def test_delete_other_users_template(
        self, client: TestClient, auth_headers: dict, admin_user: User, db_session: Session,
    ):
        t = _create_template(db_session, admin_user)
        resp = client.delete(f"/api/v1/templates/{t.id}", headers=auth_headers)
        assert resp.status_code == 404
