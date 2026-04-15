"""Stripe integration: checkout sessions, webhooks, subscriptions, credit purchases.

Best practices 2026:
- Never log full API keys
- Verify webhook signatures
- Idempotent webhook handlers
- Stripe-hosted Checkout (PCI SAQ-A compliant, no card data touches our server)
- Subscription + one-time payment support
- Metadata-driven fulfillment (user_id + package in session metadata)
"""

from __future__ import annotations

import logging
import os
from typing import Any

from app.core.security import get_current_user
from app.db.base import get_db
from app.db.models import CreditTransaction, User
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Environment-based configuration (NEVER hardcode keys)
# ---------------------------------------------------------------------------

def _env(name: str, default: str = "") -> str:
    """Read an env var and strip surrounding whitespace.

    Secret Manager often stores values with a trailing newline (the
    `echo "x" | gcloud secrets versions add` pattern). Passing such a
    value into an HTTP Authorization header throws
    ``InvalidHeader: Invalid leading whitespace, reserved character(s),
    or return character(s) in header value`` — which is what crashed
    every Stripe call.
    """
    return os.environ.get(name, default).strip()


STRIPE_SECRET_KEY = _env("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = _env("STRIPE_WEBHOOK_SECRET")
STRIPE_PUBLISHABLE_KEY = _env("STRIPE_PUBLISHABLE_KEY")
FRONTEND_URL = _env("FRONTEND_URL", "https://matcraft.ai")

# ---------------------------------------------------------------------------
# Product catalog — single source of truth for pricing
# Maps internal SKU → Stripe Price ID + credit amount
# ---------------------------------------------------------------------------

CREDIT_PACKAGES = {
    "starter_10": {
        "credits": 10,
        "price_usd": 29,
        "stripe_price_id": _env("STRIPE_PRICE_STARTER_10"),
        "label": "Starter",
        "description": "10 credits — Try the platform",
    },
    "pro_50": {
        "credits": 50,
        "price_usd": 99,
        "stripe_price_id": _env("STRIPE_PRICE_PRO_50"),
        "label": "Pro",
        "description": "50 credits — Most popular",
    },
    "enterprise_200": {
        "credits": 200,
        "price_usd": 299,
        "stripe_price_id": _env("STRIPE_PRICE_ENTERPRISE_200"),
        "label": "Enterprise",
        "description": "200 credits — Best value",
    },
    "deep_scan_pack_50": {
        "credits": 50,
        "price_usd": 199,
        "stripe_price_id": _env("STRIPE_PRICE_DEEP_SCAN_50"),
        "label": "Deep Scan Pack",
        "description": "5 Deep Scans (50 credits)",
    },
}

SUBSCRIPTION_PLANS = {
    "researcher_monthly": {
        "credits_per_month": 50,
        "price_usd": 49,
        "stripe_price_id": _env("STRIPE_PRICE_SUB_RESEARCHER"),
        "label": "Researcher",
        "description": "50 credits/month — Academics & individuals",
    },
    "professional_monthly": {
        "credits_per_month": 200,
        "price_usd": 149,
        "stripe_price_id": _env("STRIPE_PRICE_SUB_PROFESSIONAL"),
        "label": "Professional",
        "description": "200 credits/month — Industry R&D",
    },
    "enterprise_monthly": {
        "credits_per_month": 1000,
        "price_usd": 499,
        "stripe_price_id": _env("STRIPE_PRICE_SUB_ENTERPRISE"),
        "label": "Enterprise",
        "description": "1,000 credits/month + priority support",
    },
}


def _get_stripe():
    """Lazy import + configure Stripe SDK."""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Payment system not configured. Please contact support.",
        )
    try:
        import stripe  # type: ignore[import-untyped]
    except ImportError:
        raise HTTPException(status_code=503, detail="Stripe SDK not installed")
    stripe.api_key = STRIPE_SECRET_KEY
    return stripe


# ---------------------------------------------------------------------------
# Public config endpoint
# ---------------------------------------------------------------------------


@router.get("/config")
def get_stripe_config():
    """Return public Stripe config (publishable key, packages). Safe to expose."""
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
        "credit_packages": [
            {
                "id": sku,
                "label": p["label"],
                "credits": p["credits"],
                "price_usd": p["price_usd"],
                "description": p["description"],
                "price_per_credit": round(p["price_usd"] / p["credits"], 2),
            }
            for sku, p in CREDIT_PACKAGES.items()
        ],
        "subscription_plans": [
            {
                "id": sku,
                "label": p["label"],
                "credits_per_month": p["credits_per_month"],
                "price_usd": p["price_usd"],
                "description": p["description"],
            }
            for sku, p in SUBSCRIPTION_PLANS.items()
        ],
    }


# ---------------------------------------------------------------------------
# Credit package checkout
# ---------------------------------------------------------------------------


class CheckoutRequest(BaseModel):
    package: str
    success_url: str = ""
    cancel_url: str = ""


@router.post("/create-checkout-session")
def create_checkout_session(
    body: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for a one-time credit purchase."""
    stripe = _get_stripe()

    pkg = CREDIT_PACKAGES.get(body.package)
    if not pkg:
        raise HTTPException(status_code=400, detail=f"Unknown package: {body.package}")

    price_id = pkg["stripe_price_id"]
    if not price_id:
        raise HTTPException(
            status_code=503,
            detail=f"Price not configured for {body.package}. Contact support.",
        )

    success = body.success_url or f"{FRONTEND_URL}/dashboard/settings?payment=success"
    cancel = body.cancel_url or f"{FRONTEND_URL}/dashboard/settings?payment=cancel"

    # customer_email is optional in Stripe Checkout — only pass it when we
    # actually have one (phone-only signups have user.email = None and
    # Stripe rejects empty strings with an InvalidRequestError).
    metadata = {
        "user_id": user.id,
        "package": body.package,
        "credits": str(pkg["credits"]),
        "type": "credit_purchase",
    }
    create_kwargs: dict[str, Any] = {
        "mode": "payment",
        "payment_method_types": ["card"],
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": success + "&session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": cancel,
        "metadata": metadata,
        "payment_intent_data": {
            "metadata": {k: v for k, v in metadata.items() if k != "type"}
        },
        "allow_promotion_codes": True,
    }
    if user.email:
        create_kwargs["customer_email"] = user.email

    try:
        session = stripe.checkout.Session.create(**create_kwargs)
        return {"session_id": session.id, "url": session.url}
    except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
        # Specific Stripe error — surface the Stripe message verbatim so the
        # client can show something meaningful (invalid price ID, locked
        # account, network issue, etc.).
        body_text = ""
        try:
            body_text = exc.user_message or str(exc)
        except Exception:
            body_text = str(exc)
        logger.error(
            "Stripe checkout creation failed (%s, http_status=%s, code=%s): %s",
            type(exc).__name__,
            getattr(exc, "http_status", None),
            getattr(exc, "code", None),
            body_text,
            exc_info=True,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Stripe error: {body_text or 'upstream payment provider unavailable'}",
        )
    except Exception as exc:
        logger.error("Stripe checkout creation failed (unexpected): %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Payment session creation failed: {exc}")


# ---------------------------------------------------------------------------
# Subscription checkout
# ---------------------------------------------------------------------------


class SubscribeRequest(BaseModel):
    plan: str
    success_url: str = ""
    cancel_url: str = ""


@router.post("/create-subscription-session")
def create_subscription_session(
    body: SubscribeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for a monthly subscription."""
    stripe = _get_stripe()

    plan = SUBSCRIPTION_PLANS.get(body.plan)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    price_id = plan["stripe_price_id"]
    if not price_id:
        raise HTTPException(status_code=503, detail="Subscription price not configured")

    success = (
        body.success_url or f"{FRONTEND_URL}/dashboard/settings?subscription=active"
    )
    cancel = body.cancel_url or f"{FRONTEND_URL}/dashboard/settings?subscription=cancel"

    metadata = {
        "user_id": user.id,
        "plan": body.plan,
        "credits_per_month": str(plan["credits_per_month"]),
        "type": "subscription",
    }
    create_kwargs: dict[str, Any] = {
        "mode": "subscription",
        "payment_method_types": ["card"],
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": success + "&session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": cancel,
        "metadata": metadata,
        "subscription_data": {
            "metadata": {k: v for k, v in metadata.items() if k != "type"},
        },
        # Let Stripe collect tax automatically + offer promotion codes.
        "allow_promotion_codes": True,
    }
    if user.email:
        create_kwargs["customer_email"] = user.email

    try:
        session = stripe.checkout.Session.create(**create_kwargs)
        return {"session_id": session.id, "url": session.url}
    except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
        body_text = ""
        try:
            body_text = exc.user_message or str(exc)
        except Exception:
            body_text = str(exc)
        logger.error(
            "Stripe subscription creation failed (%s, http_status=%s, code=%s): %s",
            type(exc).__name__,
            getattr(exc, "http_status", None),
            getattr(exc, "code", None),
            body_text,
            exc_info=True,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Stripe error: {body_text or 'upstream payment provider unavailable'}",
        )
    except Exception as exc:
        logger.error("Stripe subscription creation failed (unexpected): %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Subscription creation failed: {exc}")


# ---------------------------------------------------------------------------
# Webhook handler (fulfills credit grants on payment_intent.succeeded)
# ---------------------------------------------------------------------------


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive Stripe webhook events. MUST verify signature."""
    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=503, detail="Webhook secret not configured")

    stripe = _get_stripe()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.warning("Invalid Stripe webhook payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:  # type: ignore[attr-defined]
        logger.warning("Invalid Stripe webhook signature")
        raise HTTPException(status_code=401, detail="Invalid signature")

    event_type = event["type"]
    event_id = event["id"]
    logger.info("Stripe webhook: %s (%s)", event_type, event_id)

    # One-time credit purchases: mode == "payment" on the checkout session.
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        mode = session.get("mode")
        if mode == "payment":
            metadata = session.get("metadata") or {}
            user_id = metadata.get("user_id")
            credits = _safe_int(metadata.get("credits"))
            package = metadata.get("package", "unknown")
            if user_id and credits > 0:
                _grant_credits(
                    db, user_id, credits, f"Stripe purchase: {package}", event_id
                )
            else:
                logger.error(
                    "checkout.session.completed missing user_id/credits metadata "
                    "(event=%s)",
                    event_id,
                )

    # Recurring subscription charges — both initial and renewal.
    elif event_type == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        billing_reason = invoice.get("billing_reason")
        if billing_reason in ("subscription_cycle", "subscription_create"):
            subscription_id = invoice.get("subscription")
            if subscription_id:
                try:
                    sub = stripe.Subscription.retrieve(subscription_id)
                    metadata = sub.get("metadata") or {}
                    user_id = metadata.get("user_id")
                    credits = _safe_int(metadata.get("credits_per_month"))
                    plan = metadata.get("plan", "unknown")
                    if user_id and credits > 0:
                        _grant_credits(
                            db, user_id, credits, f"Subscription: {plan}", event_id
                        )
                    else:
                        logger.error(
                            "subscription %s missing user_id/credits_per_month "
                            "metadata (event=%s)",
                            subscription_id,
                            event_id,
                        )
                except Exception as exc:
                    logger.error("Subscription lookup failed: %s", exc)

    elif event_type == "customer.subscription.deleted":
        logger.info("Subscription cancelled: %s", event["data"]["object"].get("id"))

    # Always 200 — Stripe will retry on non-2xx, so we only want to return a
    # non-2xx for genuine verification failures (handled above).
    return {"received": True}


def _safe_int(value: Any) -> int:
    try:
        return int(value) if value is not None else 0
    except (TypeError, ValueError):
        return 0


def _grant_credits(
    db: Session, user_id: str, credits: int, description: str, event_id: str
) -> None:
    """Idempotently grant credits for a Stripe event.

    Idempotency is enforced by a UNIQUE index on
    ``credit_transactions.stripe_event_id``. Concurrent webhook retries race on
    insert; the loser catches IntegrityError and exits cleanly. The winner
    updates the user balance in the same transaction using ``SELECT ... FOR
    UPDATE`` so concurrent grants to the same user are serialized.
    """
    # Fast path: already processed?
    if (
        db.query(CreditTransaction.id)
        .filter(CreditTransaction.stripe_event_id == event_id)
        .first()
    ):
        logger.info("Event %s already processed, skipping", event_id)
        return

    # Row-lock the user to prevent lost updates on concurrent grants.
    user = db.query(User).filter(User.id == user_id).with_for_update().first()
    if not user:
        logger.error("User %s not found for credit grant (event=%s)", user_id, event_id)
        return

    user.credits += credits
    tx = CreditTransaction(
        user_id=user.id,
        amount=credits,
        balance_after=user.credits,
        description=description,
        stripe_event_id=event_id,
    )
    db.add(tx)
    try:
        db.commit()
    except IntegrityError:
        # Another worker won the race. Roll back and treat as already processed.
        db.rollback()
        logger.info(
            "Event %s processed concurrently by another worker, skipping", event_id
        )
        return
    logger.info(
        "Granted %d credits to user %s (%s, event=%s)",
        credits,
        user.email,
        description,
        event_id,
    )


# ---------------------------------------------------------------------------
# Customer portal (subscription management)
# ---------------------------------------------------------------------------


@router.post("/create-portal-session")
def create_portal_session(user: User = Depends(get_current_user)):
    """Create a Stripe Customer Portal session for managing subscription."""
    stripe = _get_stripe()

    # Find or create Stripe customer
    customers = stripe.Customer.list(email=user.email, limit=1)
    if not customers.data:
        raise HTTPException(status_code=404, detail="No Stripe customer found")

    try:
        session = stripe.billing_portal.Session.create(
            customer=customers.data[0].id,
            return_url=f"{FRONTEND_URL}/dashboard/settings",
        )
        return {"url": session.url}
    except Exception as exc:
        logger.error("Portal session failed: %s", exc)
        raise HTTPException(status_code=500, detail="Portal session creation failed")
