"""Application configuration using pydantic-settings."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings, loaded from environment variables."""

    # App
    PROJECT_NAME: str = "MatForge"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://matforge:matforge@db:5432/matforge_dev"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"
    WEBSOCKET_REDIS_URL: str = "redis://redis:6379/3"

    # Auth
    ACCESS_TOKEN_EXPIRE_DAYS: int = 8
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    JWT_ALGORITHM: str = "HS256"
    ENABLE_API_AUTHENTICATION: bool = True

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Features
    ENABLE_REAL_TIME_UPDATES: bool = True

    # DB Pool
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    model_config = {"env_file": ".env", "case_sensitive": True}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
