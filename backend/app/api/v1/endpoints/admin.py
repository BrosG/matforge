"""Admin-only endpoints: platform stats, user management, investor requests."""

from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

from app.core.security import require_admin
from app.db.base import get_db
from app.db.models import Campaign, CreditTransaction, InvestorAccessRequest, User
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

router = APIRouter()


class AdminStats(BaseModel):
    total_users: int
    active_users_7d: int
    active_users_30d: int
    total_campaigns: int
    total_credits_sold: int
    credits_sold_30d: int
    total_transactions: int
    transactions_30d: int
    pending_investor_requests: int


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    seven_days = now - timedelta(days=7)
    thirty_days = now - timedelta(days=30)

    total_users = db.query(func.count(User.id)).scalar() or 0
    active_7d = (
        db.query(func.count(User.id)).filter(User.updated_at >= seven_days).scalar()
        or 0
    )
    active_30d = (
        db.query(func.count(User.id)).filter(User.updated_at >= thirty_days).scalar()
        or 0
    )
    total_campaigns = db.query(func.count(Campaign.id)).scalar() or 0

    positive_tx = db.query(func.coalesce(func.sum(CreditTransaction.amount), 0)).filter(
        CreditTransaction.amount > 0
    )
    total_credits_sold = positive_tx.scalar() or 0
    credits_30d = (
        positive_tx.filter(CreditTransaction.created_at >= thirty_days).scalar() or 0
    )

    total_tx = db.query(func.count(CreditTransaction.id)).scalar() or 0
    tx_30d = (
        db.query(func.count(CreditTransaction.id))
        .filter(CreditTransaction.created_at >= thirty_days)
        .scalar()
        or 0
    )

    pending_req = (
        db.query(func.count(InvestorAccessRequest.id))
        .filter(InvestorAccessRequest.status == "pending")
        .scalar()
        or 0
    )

    return AdminStats(
        total_users=total_users,
        active_users_7d=active_7d,
        active_users_30d=active_30d,
        total_campaigns=total_campaigns,
        total_credits_sold=int(total_credits_sold),
        credits_sold_30d=int(credits_30d),
        total_transactions=total_tx,
        transactions_30d=tx_30d,
        pending_investor_requests=pending_req,
    )


class UserOut(BaseModel):
    id: str
    email: str | None
    full_name: str | None
    credits: int
    is_admin: bool
    is_active: bool
    created_at: str
    updated_at: str | None


@router.get("/users")
def list_users(
    page: int = 1,
    limit: int = 50,
    search: str = "",
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    limit = min(limit, 200)
    query = db.query(User)
    if search:
        query = query.filter(User.email.ilike(f"%{search}%"))
    total = query.count()
    users = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": [
            UserOut(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                credits=u.credits,
                is_admin=u.is_admin,
                is_active=u.is_active,
                created_at=u.created_at.isoformat() if u.created_at else "",
                updated_at=u.updated_at.isoformat() if u.updated_at else None,
            )
            for u in users
        ],
    }


class AddCreditsRequest(BaseModel):
    amount: int
    reason: str = "Admin grant"


@router.post("/users/{user_id}/credits")
def add_credits(
    user_id: str,
    body: AddCreditsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.credits += body.amount
    tx = CreditTransaction(
        user_id=user.id,
        amount=body.amount,
        balance_after=user.credits,
        description=f"Admin: {body.reason}",
    )
    db.add(tx)
    db.commit()
    return {"credits": user.credits, "transaction_id": tx.id}


@router.post("/users/{user_id}/toggle-admin")
def toggle_admin(
    user_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = not user.is_admin
    db.commit()
    return {"is_admin": user.is_admin}


@router.get("/transactions")
def list_transactions(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    limit = min(limit, 200)
    query = db.query(CreditTransaction).order_by(CreditTransaction.created_at.desc())
    total = query.count()
    txs = query.offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "transactions": [
            {
                "id": t.id,
                "user_id": t.user_id,
                "amount": t.amount,
                "balance_after": t.balance_after,
                "description": t.description,
                "created_at": t.created_at.isoformat() if t.created_at else "",
            }
            for t in txs
        ],
    }


@router.get("/investor-requests")
def list_investor_requests(
    status: str = "all",
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = db.query(InvestorAccessRequest)
    if status != "all":
        query = query.filter(InvestorAccessRequest.status == status)
    requests = query.order_by(InvestorAccessRequest.created_at.desc()).limit(200).all()
    return {
        "requests": [
            {
                "id": r.id,
                "full_name": r.full_name,
                "email": r.email,
                "company": r.company,
                "role": r.role,
                "message": r.message,
                "status": r.status,
                "access_password": r.access_password
                if r.status == "approved"
                else None,
                "created_at": r.created_at.isoformat() if r.created_at else "",
                "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            }
            for r in requests
        ]
    }


def _gen_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.post("/investor-requests/{req_id}/approve")
def approve_request(
    req_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    req = (
        db.query(InvestorAccessRequest)
        .filter(InvestorAccessRequest.id == req_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "approved"
    req.access_password = _gen_password(16)
    req.reviewed_at = datetime.now(timezone.utc)
    req.reviewed_by = admin.id
    db.commit()
    return {
        "status": "approved",
        "access_password": req.access_password,
        "email": req.email,
    }


@router.post("/investor-requests/{req_id}/reject")
def reject_request(
    req_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    req = (
        db.query(InvestorAccessRequest)
        .filter(InvestorAccessRequest.id == req_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "rejected"
    req.reviewed_at = datetime.now(timezone.utc)
    req.reviewed_by = admin.id
    db.commit()
    return {"status": "rejected"}
