"""Public investor access endpoints: request access + verify password."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import InvestorAccessRequest

router = APIRouter()


class InvestorRequestBody(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., min_length=3, max_length=200)
    company: str = Field("", max_length=200)
    role: str = Field("Investor", max_length=100)
    message: str = Field("", max_length=2000)


@router.post("/request")
def request_access(body: InvestorRequestBody, db: Session = Depends(get_db)):
    """Submit an access request to the investor data room. Requires admin approval."""
    req = InvestorAccessRequest(
        full_name=body.full_name.strip(),
        email=body.email.strip().lower(),
        company=body.company.strip() or None,
        role=body.role.strip() or "Investor",
        message=body.message.strip() or None,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {
        "request_id": req.id,
        "status": "pending",
        "message": "Your request has been submitted. You will receive access credentials within 24 hours after review.",
    }


class VerifyBody(BaseModel):
    password: str


@router.post("/verify")
def verify_access(body: VerifyBody, db: Session = Depends(get_db)):
    """Verify an access password issued by an admin."""
    pw = body.password.strip()
    if not pw:
        raise HTTPException(status_code=400, detail="Password required")

    req = (
        db.query(InvestorAccessRequest)
        .filter(
            InvestorAccessRequest.access_password == pw,
            InvestorAccessRequest.status == "approved",
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=401, detail="Invalid access password")

    return {
        "valid": True,
        "request_id": req.id,
        "full_name": req.full_name,
        "company": req.company,
    }
