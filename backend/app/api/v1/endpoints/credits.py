"""Credit system – balance, purchase, history, and deduction helpers."""

from __future__ import annotations

import logging
import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db.models import CreditTransaction, User

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

PACKAGES = {
    "starter_10": {"credits": 10, "price_usd": 29},
    "pro_50": {"credits": 50, "price_usd": 99},
    "enterprise_200": {"credits": 200, "price_usd": 299},
    "deep_scan_5": {"credits": 50, "price_usd": 199},
}


class BalanceResponse(BaseModel):
    credits: int
    email: str | None


class PurchaseRequest(BaseModel):
    package: str  # "starter_10", "pro_50", "enterprise_200", "deep_scan_5"


class PurchaseResponse(BaseModel):
    credits: int
    purchased: int
    package: str
    price_usd: int


class TransactionOut(BaseModel):
    id: str
    amount: int
    balance_after: int
    description: str | None
    created_at: str


class HistoryResponse(BaseModel):
    transactions: List[TransactionOut]


# ---------------------------------------------------------------------------
# Helper: atomic credit deduction
# ---------------------------------------------------------------------------


def deduct_credits(db: Session, user: User, amount: int, description: str) -> bool:
    """Deduct credits from user atomically. Returns False if insufficient balance.

    Uses ``SELECT ... FOR UPDATE`` to serialize concurrent deductions on the
    same user (prevents double-spend under concurrent requests). The caller's
    ``user`` instance is refreshed to reflect the committed balance.
    """
    if amount <= 0:
        return True

    locked = (
        db.query(User)
        .filter(User.id == user.id)
        .with_for_update()
        .first()
    )
    if not locked or locked.credits < amount:
        return False

    locked.credits -= amount
    tx = CreditTransaction(
        user_id=locked.id,
        amount=-amount,
        balance_after=locked.credits,
        description=description,
    )
    db.add(tx)
    db.commit()
    db.refresh(user)
    return True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/balance", response_model=BalanceResponse)
def get_balance(
    user: User = Depends(get_current_user),
):
    return BalanceResponse(credits=user.credits, email=user.email)


@router.post("/purchase", response_model=PurchaseResponse)
def purchase_credits(
    body: PurchaseRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Simulate a credit purchase — DEV ONLY.

    Real purchases must go through Stripe Checkout (see
    ``/api/v1/stripe/create-checkout-session``). This endpoint bypasses payment
    and is therefore gated to non-production environments. In production it
    returns 404 so it does not leak that the route exists.
    """
    env = os.environ.get("ENVIRONMENT", "development").lower()
    if env in ("production", "prod"):
        # Pretend it doesn't exist in prod — never grant free credits.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    pkg = PACKAGES.get(body.package)
    if not pkg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown package: {body.package}. Valid: {list(PACKAGES.keys())}",
        )

    added = pkg["credits"]

    locked = (
        db.query(User)
        .filter(User.id == user.id)
        .with_for_update()
        .first()
    )
    if not locked:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    locked.credits += added
    tx = CreditTransaction(
        user_id=locked.id,
        amount=added,
        balance_after=locked.credits,
        description=f"[DEV] Simulated purchase: {body.package} ({added} credits, ${pkg['price_usd']})",
    )
    db.add(tx)
    db.commit()
    db.refresh(user)

    return PurchaseResponse(
        credits=user.credits,
        purchased=added,
        package=body.package,
        price_usd=pkg["price_usd"],
    )


@router.get("/history", response_model=HistoryResponse)
def get_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txs = (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user.id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(50)
        .all()
    )
    return HistoryResponse(
        transactions=[
            TransactionOut(
                id=t.id,
                amount=t.amount,
                balance_after=t.balance_after,
                description=t.description,
                created_at=t.created_at.isoformat() if t.created_at else "",
            )
            for t in txs
        ]
    )
