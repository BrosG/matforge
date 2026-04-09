"""MatCraft Python SDK — programmatic access to the MatCraft platform."""

from matforge_sdk.client import MatForgeClient
from matforge_sdk.models import (
    Campaign,
    CampaignConfig,
    CampaignResult,
    DatasetEntry,
    MaterialRecord,
    Template,
)

__version__ = "0.1.0"
__all__ = [
    "MatForgeClient",
    "Campaign",
    "CampaignConfig",
    "CampaignResult",
    "DatasetEntry",
    "MaterialRecord",
    "Template",
]
