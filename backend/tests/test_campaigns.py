"""Tests for campaign CRUD and execution endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Campaign, MaterialRecord, User
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


def _create_campaign(db: Session, owner: User, **kwargs) -> Campaign:
    defaults = {
        "name": "Test Campaign",
        "domain": "test",
        "definition_yaml": SAMPLE_YAML,
        "config": {},
        "status": "pending",
        "owner_id": owner.id,
    }
    defaults.update(kwargs)
    campaign = Campaign(**defaults)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


class TestCreateCampaign:
    def test_create_success(self, client: TestClient, auth_headers: dict):
        resp = client.post("/api/v1/campaigns", headers=auth_headers, json={
            "name": "My Campaign",
            "domain": "water",
            "definition_yaml": SAMPLE_YAML,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "My Campaign"
        assert data["domain"] == "water"
        assert data["status"] == "pending"

    def test_create_no_auth(self, client: TestClient):
        resp = client.post("/api/v1/campaigns", json={
            "name": "Nope",
            "domain": "test",
            "definition_yaml": SAMPLE_YAML,
        })
        assert resp.status_code in (401, 403)


class TestListCampaigns:
    def test_list_own_campaigns(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        _create_campaign(db_session, test_user, name="C1")
        _create_campaign(db_session, test_user, name="C2")
        resp = client.get("/api/v1/campaigns", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["campaigns"]) == 2

    def test_list_filters_by_domain(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        _create_campaign(db_session, test_user, domain="water")
        _create_campaign(db_session, test_user, domain="solar")
        resp = client.get("/api/v1/campaigns?domain=water", headers=auth_headers)
        assert resp.json()["total"] == 1

    def test_list_filters_by_status(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        _create_campaign(db_session, test_user, status="completed")
        _create_campaign(db_session, test_user, status="pending")
        resp = client.get("/api/v1/campaigns?status=completed", headers=auth_headers)
        assert resp.json()["total"] == 1


class TestGetCampaign:
    def test_get_own_campaign(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        c = _create_campaign(db_session, test_user)
        resp = client.get(f"/api/v1/campaigns/{c.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == c.id

    def test_get_nonexistent(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/v1/campaigns/nonexistent-id", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_other_users_campaign(
        self, client: TestClient, auth_headers: dict, admin_user: User, db_session: Session,
    ):
        c = _create_campaign(db_session, admin_user)
        resp = client.get(f"/api/v1/campaigns/{c.id}", headers=auth_headers)
        assert resp.status_code == 404  # not visible to other user


class TestDeleteCampaign:
    def test_delete_success(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        c = _create_campaign(db_session, test_user)
        resp = client.delete(f"/api/v1/campaigns/{c.id}", headers=auth_headers)
        assert resp.status_code == 204

    def test_delete_running_campaign_rejected(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        c = _create_campaign(db_session, test_user, status="running")
        resp = client.delete(f"/api/v1/campaigns/{c.id}", headers=auth_headers)
        assert resp.status_code == 409


class TestCampaignResults:
    def test_results_empty(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        c = _create_campaign(db_session, test_user, status="completed")
        resp = client.get(f"/api/v1/campaigns/{c.id}/results", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["pareto_front"] == []
        assert data["all_materials"] == []

    def test_results_with_materials(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        c = _create_campaign(db_session, test_user, status="completed")
        for i in range(3):
            rec = MaterialRecord(
                campaign_id=c.id,
                params=[0.1 * i, 0.2],
                properties={"f1": float(i), "f2": float(10 - i)},
                score=float(i),
                source="physics",
                dominated=i > 0,
                round_number=1,
            )
            db_session.add(rec)
        db_session.commit()

        resp = client.get(f"/api/v1/campaigns/{c.id}/results", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["all_materials"]) == 3
        assert len(data["pareto_front"]) == 1  # only dominated=False


class TestPublicCampaigns:
    def test_public_list(
        self, client: TestClient, test_user: User, db_session: Session,
    ):
        _create_campaign(db_session, test_user, status="completed", name="Public1")
        _create_campaign(db_session, test_user, status="pending", name="Private1")
        resp = client.get("/api/v1/campaigns/public")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["campaigns"][0]["name"] == "Public1"


class TestExportCampaign:
    def test_export_csv(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        c = _create_campaign(db_session, test_user)
        rec = MaterialRecord(
            campaign_id=c.id,
            params=[0.5, 0.5],
            properties={"f1": 1.0, "f2": 2.0},
            score=1.5,
            source="physics",
        )
        db_session.add(rec)
        db_session.commit()

        resp = client.get(
            f"/api/v1/campaigns/{c.id}/export?format=csv", headers=auth_headers
        )
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]

    def test_export_json(
        self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session,
    ):
        c = _create_campaign(db_session, test_user)
        rec = MaterialRecord(
            campaign_id=c.id,
            params=[0.5, 0.5],
            properties={"f1": 1.0},
            score=1.0,
            source="initial",
        )
        db_session.add(rec)
        db_session.commit()

        resp = client.get(
            f"/api/v1/campaigns/{c.id}/export?format=json", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
