"""Dataset search and import endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db.models import Campaign, MaterialRecord, User

router = APIRouter()


# --- Schemas ---


class DatasetSearchRequest(BaseModel):
    source: str  # "materials_project" | "aflow" | "oqmd" | "optimade" | "jarvis" | "perovskite_db" | "gnome" | "opendac"
    elements: list[str] | None = None
    formula: str | None = None
    property_range: dict[str, list[float]] | None = None
    max_results: int = 50


class DatasetEntryResponse(BaseModel):
    external_id: str
    formula: str
    properties: dict[str, float]
    source_db: str


class DatasetSearchResponse(BaseModel):
    entries: list[DatasetEntryResponse]
    total: int
    source: str


class DatasetImportRequest(BaseModel):
    source: str
    external_ids: list[str]
    campaign_id: str


class DatasetImportResponse(BaseModel):
    imported: int
    campaign_id: str


# --- Helpers ---


def _get_connector(source: str):
    """Return the correct connector instance for the given source."""
    if source == "materials_project":
        from materia.connectors.materials_project import MaterialsProjectConnector

        return MaterialsProjectConnector()
    elif source == "aflow":
        from materia.connectors.aflow import AflowConnector

        return AflowConnector()
    elif source == "oqmd":
        from materia.connectors.oqmd import OqmdConnector

        return OqmdConnector()
    elif source == "optimade":
        from materia.connectors.optimade import OptimadeConnector

        return OptimadeConnector()
    elif source == "jarvis":
        from materia.connectors.jarvis import JarvisConnector

        return JarvisConnector()
    elif source == "perovskite_db":
        from materia.connectors.perovskite import PerovskiteConnector

        return PerovskiteConnector()
    elif source == "gnome":
        from materia.connectors.gnome import GnomeConnector

        return GnomeConnector()
    elif source == "opendac":
        from materia.connectors.opendac import OpenDACConnector

        return OpenDACConnector()
    else:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown source: {source}. Valid sources: "
                "'materials_project', 'aflow', 'oqmd', 'optimade', "
                "'jarvis', 'perovskite_db', 'gnome', 'opendac'."
            ),
        )


# --- Endpoints ---


@router.post("/search", response_model=DatasetSearchResponse)
def search_datasets(
    body: DatasetSearchRequest,
    _current_user: User = Depends(get_current_user),
):
    """Search a public materials database."""
    connector = _get_connector(body.source)

    prop_range = None
    if body.property_range:
        prop_range = {k: (v[0], v[1]) for k, v in body.property_range.items()}

    entries = connector.search(
        elements=body.elements,
        formula=body.formula,
        property_range=prop_range,
        max_results=body.max_results,
    )

    return DatasetSearchResponse(
        entries=[
            DatasetEntryResponse(
                external_id=e.external_id,
                formula=e.formula,
                properties=e.properties,
                source_db=e.source_db,
            )
            for e in entries
        ],
        total=len(entries),
        source=body.source,
    )


@router.post("/import", response_model=DatasetImportResponse)
def import_dataset(
    body: DatasetImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Import materials from a public database into a campaign."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == body.campaign_id, Campaign.owner_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    connector = _get_connector(body.source)

    imported = 0
    for ext_id in body.external_ids:
        try:
            entry = connector.get_by_id(ext_id)
        except Exception:
            continue

        record = MaterialRecord(
            campaign_id=campaign.id,
            params=entry.properties,
            properties=entry.properties,
            composition={},
            score=0.0,
            source=f"import:{body.source}",
            round_number=0,
            metadata_={
                "external_id": entry.external_id,
                "source_db": entry.source_db,
                "formula": entry.formula,
            },
        )
        db.add(record)
        imported += 1

    if imported:
        db.commit()

    return DatasetImportResponse(imported=imported, campaign_id=campaign.id)
