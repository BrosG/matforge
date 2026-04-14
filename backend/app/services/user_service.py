"""User service for database operations."""

from __future__ import annotations

from typing import Optional

from app.core.security import hash_password, verify_password
from app.db.models import User
from sqlalchemy.orm import Session


def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create(
    db: Session,
    email: str,
    password: Optional[str] = None,
    full_name: Optional[str] = None,
    oauth_provider: Optional[str] = None,
    oauth_id: Optional[str] = None,
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password) if password else None,
        full_name=full_name,
        oauth_provider=oauth_provider,
        oauth_id=oauth_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> Optional[User]:
    user = get_by_email(db, email)
    if not user or not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_or_create_oauth_user(
    db: Session,
    email: str,
    oauth_provider: str,
    oauth_id: str,
    full_name: Optional[str] = None,
) -> User:
    user = (
        db.query(User)
        .filter(User.oauth_provider == oauth_provider, User.oauth_id == oauth_id)
        .first()
    )
    if user:
        return user

    user = get_by_email(db, email)
    if user:
        user.oauth_provider = oauth_provider
        user.oauth_id = oauth_id
        db.commit()
        db.refresh(user)
        return user

    return create(
        db,
        email=email,
        full_name=full_name,
        oauth_provider=oauth_provider,
        oauth_id=oauth_id,
    )
