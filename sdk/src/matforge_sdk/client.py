"""MatForge API client."""

from __future__ import annotations

from typing import Optional

import httpx

from matforge_sdk.models import (
    Campaign,
    CampaignConfig,
    CampaignListResponse,
    CampaignResult,
    DatasetImportResponse,
    DatasetSearchResponse,
    Template,
    TemplateForkResponse,
    TemplateListResponse,
    TokenResponse,
)


class MatForgeError(Exception):
    """Raised when an API request fails."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"HTTP {status_code}: {detail}")


class MatForgeClient:
    """Synchronous Python client for the MatForge REST API.

    Usage::

        client = MatForgeClient("http://localhost:8000/api/v1")
        client.login("user@example.com", "password")
        campaigns = client.list_campaigns()
    """

    def __init__(
        self,
        base_url: str = "http://localhost:8000/api/v1",
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._token: Optional[str] = None
        self._client = httpx.Client(timeout=timeout)
        if api_key:
            self._token = api_key

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()

    def __enter__(self) -> "MatForgeClient":
        return self

    def __exit__(self, *args) -> None:
        self.close()

    # --- Internal ---

    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        return headers

    def _request(
        self,
        method: str,
        path: str,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict:
        resp = self._client.request(
            method,
            f"{self.base_url}{path}",
            json=json,
            params=params,
            headers=self._headers(),
        )
        if resp.status_code == 204:
            return {}
        if resp.status_code >= 400:
            detail = ""
            try:
                detail = resp.json().get("detail", resp.text)
            except Exception:
                detail = resp.text
            raise MatForgeError(resp.status_code, detail)
        return resp.json()

    # --- Auth ---

    def login(self, email: str, password: str) -> TokenResponse:
        """Authenticate with email and password."""
        data = self._request(
            "POST", "/users/login", json={"email": email, "password": password}
        )
        token = TokenResponse(**data)
        self._token = token.access_token
        return token

    def guest(self) -> TokenResponse:
        """Login as a guest user."""
        data = self._request("POST", "/users/guest")
        token = TokenResponse(**data)
        self._token = token.access_token
        return token

    # --- Campaigns ---

    def list_campaigns(
        self,
        page: int = 1,
        limit: int = 20,
        domain: Optional[str] = None,
        status: Optional[str] = None,
    ) -> CampaignListResponse:
        """List campaigns for the authenticated user."""
        params: dict = {"page": page, "limit": limit}
        if domain:
            params["domain"] = domain
        if status:
            params["status"] = status
        data = self._request("GET", "/campaigns", params=params)
        return CampaignListResponse(**data)

    def create_campaign(
        self,
        name: str,
        domain: str,
        definition_yaml: str,
        description: Optional[str] = None,
        config: Optional[dict] = None,
    ) -> Campaign:
        """Create a new campaign."""
        body: dict = {
            "name": name,
            "domain": domain,
            "definition_yaml": definition_yaml,
        }
        if description:
            body["description"] = description
        if config:
            body["config"] = config
        data = self._request("POST", "/campaigns", json=body)
        return Campaign(**data)

    def get_campaign(self, campaign_id: str) -> Campaign:
        """Get a single campaign by ID."""
        data = self._request("GET", f"/campaigns/{campaign_id}")
        return Campaign(**data)

    def run_campaign(
        self,
        campaign_id: str,
        config: Optional[CampaignConfig] = None,
    ) -> Campaign:
        """Launch a campaign execution."""
        body = (config or CampaignConfig()).model_dump()
        data = self._request("POST", f"/campaigns/{campaign_id}/run", json=body)
        return Campaign(**data)

    def get_results(self, campaign_id: str) -> CampaignResult:
        """Get full results for a campaign."""
        data = self._request("GET", f"/campaigns/{campaign_id}/results")
        return CampaignResult(**data)

    def delete_campaign(self, campaign_id: str) -> None:
        """Delete a campaign."""
        self._request("DELETE", f"/campaigns/{campaign_id}")

    def export_url(
        self, campaign_id: str, format: str = "csv"
    ) -> str:
        """Get the export URL for a campaign."""
        return f"{self.base_url}/campaigns/{campaign_id}/export?format={format}"

    # --- Datasets ---

    def search_datasets(
        self,
        source: str,
        elements: Optional[list[str]] = None,
        formula: Optional[str] = None,
        max_results: int = 50,
    ) -> DatasetSearchResponse:
        """Search a public materials database."""
        body: dict = {"source": source, "max_results": max_results}
        if elements:
            body["elements"] = elements
        if formula:
            body["formula"] = formula
        data = self._request("POST", "/datasets/search", json=body)
        return DatasetSearchResponse(**data)

    def import_dataset(
        self,
        source: str,
        external_ids: list[str],
        campaign_id: str,
    ) -> DatasetImportResponse:
        """Import materials from a public database into a campaign."""
        data = self._request(
            "POST",
            "/datasets/import",
            json={
                "source": source,
                "external_ids": external_ids,
                "campaign_id": campaign_id,
            },
        )
        return DatasetImportResponse(**data)

    # --- Templates ---

    def list_templates(
        self,
        page: int = 1,
        limit: int = 20,
        domain: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "recent",
    ) -> TemplateListResponse:
        """List templates from the marketplace."""
        params: dict = {"page": page, "limit": limit, "sort": sort}
        if domain:
            params["domain"] = domain
        if search:
            params["search"] = search
        data = self._request("GET", "/templates", params=params)
        return TemplateListResponse(**data)

    def get_template(self, template_id: str) -> Template:
        """Get a single template by ID."""
        data = self._request("GET", f"/templates/{template_id}")
        return Template(**data)

    def create_template(
        self,
        name: str,
        domain: str,
        definition_yaml: str,
        description: Optional[str] = None,
        tags: Optional[list[str]] = None,
    ) -> Template:
        """Publish a new template."""
        body: dict = {
            "name": name,
            "domain": domain,
            "definition_yaml": definition_yaml,
        }
        if description:
            body["description"] = description
        if tags:
            body["tags"] = tags
        data = self._request("POST", "/templates", json=body)
        return Template(**data)

    def like_template(self, template_id: str) -> dict:
        """Toggle like on a template."""
        return self._request("POST", f"/templates/{template_id}/like")

    def fork_template(self, template_id: str) -> TemplateForkResponse:
        """Fork a template into a new campaign."""
        data = self._request("POST", f"/templates/{template_id}/fork")
        return TemplateForkResponse(**data)

    def delete_template(self, template_id: str) -> None:
        """Delete a template."""
        self._request("DELETE", f"/templates/{template_id}")
