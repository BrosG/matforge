"""Template marketplace endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.core.security import get_current_user
from app.db.base import get_db
from app.db.models import Campaign, Template, TemplateLike, User
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()


# --- Schemas ---


class TemplateCreateRequest(BaseModel):
    name: str
    description: str | None = None
    domain: str
    definition_yaml: str
    tags: list[str] = []


class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str | None
    domain: str
    definition_yaml: str
    author_id: str
    author_name: str | None = None
    likes_count: int
    forks_count: int
    is_official: bool
    tags: list[str]
    created_at: datetime
    updated_at: datetime | None
    liked_by_me: bool = False

    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    templates: list[TemplateResponse]
    total: int
    page: int
    limit: int


class TemplateForkResponse(BaseModel):
    campaign_id: str
    template_id: str


# --- Helpers ---


def _template_to_response(
    template: Template,
    liked_by_me: bool = False,
) -> TemplateResponse:
    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        domain=template.domain,
        definition_yaml=template.definition_yaml,
        author_id=template.author_id,
        author_name=template.author.full_name if template.author else None,
        likes_count=template.likes_count,
        forks_count=template.forks_count,
        is_official=template.is_official,
        tags=template.tags or [],
        created_at=template.created_at,
        updated_at=template.updated_at,
        liked_by_me=liked_by_me,
    )


# --- Endpoints ---


@router.get("", response_model=TemplateListResponse)
def list_templates(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    domain: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = Query("recent", pattern="^(recent|popular)$"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """List templates with optional filtering and sorting."""
    query = db.query(Template)

    if domain:
        query = query.filter(Template.domain == domain)
    if search:
        query = query.filter(
            Template.name.ilike(f"%{search}%")
            | Template.description.ilike(f"%{search}%")
        )

    if sort == "popular":
        query = query.order_by(Template.likes_count.desc())
    else:
        query = query.order_by(Template.created_at.desc())

    total = query.count()
    templates = query.offset((page - 1) * limit).limit(limit).all()

    # Check which templates are liked by the current user
    liked_ids: set[str] = set()
    if current_user:
        likes = (
            db.query(TemplateLike.template_id)
            .filter(
                TemplateLike.user_id == current_user.id,
                TemplateLike.template_id.in_([t.id for t in templates]),
            )
            .all()
        )
        liked_ids = {like[0] for like in likes}

    return TemplateListResponse(
        templates=[
            _template_to_response(t, liked_by_me=t.id in liked_ids) for t in templates
        ],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Get a single template by ID."""
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    liked = False
    if current_user:
        liked = (
            db.query(TemplateLike)
            .filter(
                TemplateLike.template_id == template_id,
                TemplateLike.user_id == current_user.id,
            )
            .first()
            is not None
        )

    return _template_to_response(template, liked_by_me=liked)


@router.post("", response_model=TemplateResponse, status_code=201)
def create_template(
    body: TemplateCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Publish a new template."""
    template = Template(
        name=body.name,
        description=body.description,
        domain=body.domain,
        definition_yaml=body.definition_yaml,
        author_id=current_user.id,
        tags=body.tags,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return _template_to_response(template)


@router.post("/{template_id}/like")
def toggle_like(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle like on a template."""
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    existing = (
        db.query(TemplateLike)
        .filter(
            TemplateLike.template_id == template_id,
            TemplateLike.user_id == current_user.id,
        )
        .first()
    )

    if existing:
        db.delete(existing)
        template.likes_count = max(0, template.likes_count - 1)
        liked = False
    else:
        like = TemplateLike(
            template_id=template_id,
            user_id=current_user.id,
        )
        db.add(like)
        template.likes_count += 1
        liked = True

    db.commit()
    return {"liked": liked, "likes_count": template.likes_count}


@router.post("/{template_id}/fork", response_model=TemplateForkResponse)
def fork_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fork a template into a new campaign."""
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    campaign = Campaign(
        name=f"{template.name} (from template)",
        description=template.description,
        domain=template.domain,
        definition_yaml=template.definition_yaml,
        owner_id=current_user.id,
        status="pending",
        config={"forked_from_template": template.id},
    )
    db.add(campaign)
    template.forks_count += 1
    db.commit()
    db.refresh(campaign)

    return TemplateForkResponse(campaign_id=campaign.id, template_id=template.id)


@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a template (author only)."""
    template = (
        db.query(Template)
        .filter(Template.id == template_id, Template.author_id == current_user.id)
        .first()
    )
    if not template:
        raise HTTPException(
            status_code=404, detail="Template not found or not owned by you"
        )

    db.query(TemplateLike).filter(TemplateLike.template_id == template_id).delete()
    db.delete(template)
    db.commit()
