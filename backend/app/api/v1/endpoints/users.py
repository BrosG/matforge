"""User authentication and management endpoints."""

from __future__ import annotations

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.base import get_db
from app.db.models import CreditTransaction, User
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None


class OAuthGoogleRequest(BaseModel):
    # Called from NextAuth server-side JWT callback — NextAuth already
    # verified the Google token; we trust the email/google_id from it.
    email: str
    name: str | None = None
    google_id: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str | None = None
    email: str | None = None
    name: str | None = None
    phone_number: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str | None
    phone_number: str | None = None
    full_name: str | None
    is_admin: bool

    model_config = {"from_attributes": True}


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email/password and receive tokens."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user_id=user.id,
        email=user.email,
        name=user.full_name,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.flush()
    # Audit trail for the starter-credit grant (balance comes from column default).
    db.add(
        CreditTransaction(
            user_id=user.id,
            amount=user.credits,
            balance_after=user.credits,
            description="Signup bonus",
        )
    )
    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user_id=user.id,
        email=user.email,
        name=user.full_name,
    )


@router.post("/oauth/google", response_model=TokenResponse)
def oauth_google(body: OAuthGoogleRequest, db: Session = Depends(get_db)):
    """Handle Google OAuth sign-in.

    Called from NextAuth server-side JWT callback. NextAuth has already
    verified the Google token via OAuth2 PKCE flow; we trust email + google_id.
    """
    google_id = body.google_id
    email = body.email.strip().lower()
    name = body.name or ""

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = (
        db.query(User)
        .filter(User.oauth_provider == "google", User.oauth_id == google_id)
        .first()
    )
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.oauth_provider = "google"
            user.oauth_id = google_id
        else:
            user = User(
                email=email,
                full_name=name,
                oauth_provider="google",
                oauth_id=google_id,
            )
            db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


GUEST_EMAIL = "guest@matcraft.local"


@router.post("/guest", response_model=TokenResponse)
def guest_login(db: Session = Depends(get_db)):
    """Create or reuse a guest account for quick testing."""
    user = db.query(User).filter(User.email == GUEST_EMAIL).first()
    if not user:
        user = User(
            email=GUEST_EMAIL,
            full_name="Guest User",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.email is not None and body.email != current_user.email:
        existing = db.query(User).filter(User.email == body.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use",
            )
        current_user.email = body.email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using a refresh token."""
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh_token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/validate-token")
def validate_token(current_user: User = Depends(get_current_user)):
    """Check if the current token is valid."""
    return {"valid": True, "user_id": current_user.id}


class FirebaseAuthRequest(BaseModel):
    id_token: str


@router.post("/oauth/firebase", response_model=TokenResponse)
def firebase_auth_endpoint(body: FirebaseAuthRequest, db: Session = Depends(get_db)):
    """Handle Firebase Authentication sign-in."""
    from app.core.firebase import verify_firebase_token

    try:
        decoded = verify_firebase_token(body.id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token",
        )

    email = decoded.get("email")
    phone = decoded.get("phone_number")
    uid = decoded.get("uid")
    name = decoded.get("name", email or phone)

    if not email and not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase token missing email and phone claims",
        )

    # Look up by Firebase uid first
    user = (
        db.query(User)
        .filter(User.oauth_provider == "firebase", User.oauth_id == uid)
        .first()
    )
    if not user:
        # Try matching by email or phone
        if email:
            user = db.query(User).filter(User.email == email).first()
        if not user and phone:
            user = db.query(User).filter(User.phone_number == phone).first()

        if user:
            user.oauth_provider = "firebase"
            user.oauth_id = uid
            if phone and not user.phone_number:
                user.phone_number = phone
        else:
            user = User(
                email=email,
                phone_number=phone,
                full_name=name,
                oauth_provider="firebase",
                oauth_id=uid,
            )
            db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user_id=user.id,
        email=user.email,
        name=user.full_name,
        phone_number=user.phone_number,
    )
