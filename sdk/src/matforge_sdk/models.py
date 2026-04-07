"""Pydantic models mirroring the MatForge API responses."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CampaignConfig(BaseModel):
    budget: int = 500
    rounds: int = 15
    surrogate_evals: int = 5_000_000
    seed: Optional[int] = None


class Campaign(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    domain: str
    status: str
    config: dict = {}
    progress: int = 0
    current_round: int = 0
    total_rounds: int = 0
    total_evaluated: int = 0
    pareto_size: int = 0
    wall_time_seconds: Optional[float] = None
    owner_id: str = ""
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class CampaignListResponse(BaseModel):
    campaigns: list[Campaign]
    total: int
    page: int
    limit: int


class MaterialRecord(BaseModel):
    id: str
    params: list = []
    properties: dict = {}
    composition: dict = {}
    score: float = 0.0
    source: str = ""
    uncertainty: dict = {}
    dominated: bool = False
    round_number: int = 0


class CampaignResult(BaseModel):
    campaign: Campaign
    pareto_front: list[MaterialRecord]
    all_materials: list[MaterialRecord]


class DatasetEntry(BaseModel):
    external_id: str
    formula: str
    properties: dict[str, float]
    source_db: str = ""


class DatasetSearchResponse(BaseModel):
    entries: list[DatasetEntry]
    total: int
    source: str


class DatasetImportResponse(BaseModel):
    imported: int
    campaign_id: str


class Template(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    domain: str
    definition_yaml: str = ""
    author_id: str = ""
    author_name: Optional[str] = None
    likes_count: int = 0
    forks_count: int = 0
    is_official: bool = False
    tags: list[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TemplateListResponse(BaseModel):
    templates: list[Template]
    total: int
    page: int
    limit: int


class TemplateForkResponse(BaseModel):
    campaign_id: str
    template_id: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
