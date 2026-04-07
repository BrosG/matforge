"""Redis connection management."""

from __future__ import annotations

import logging
import os
from typing import Optional

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None
_ws_redis_client: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    """Get or create the main Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
            retry_on_timeout=True,
        )
    return _redis_client


def get_ws_redis() -> redis.Redis:
    """Get or create the WebSocket Redis client (separate DB for pub/sub)."""
    global _ws_redis_client
    if _ws_redis_client is None:
        _ws_redis_client = redis.Redis.from_url(
            settings.WEBSOCKET_REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
            retry_on_timeout=True,
        )
    return _ws_redis_client


def close_redis() -> None:
    """Close all Redis connections."""
    global _redis_client, _ws_redis_client
    if _redis_client:
        _redis_client.close()
        _redis_client = None
    if _ws_redis_client:
        _ws_redis_client.close()
        _ws_redis_client = None
