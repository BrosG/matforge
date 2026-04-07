"""Custom middleware for security and rate limiting."""

from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Simple fixed-window rate limiting using Redis."""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.rpm = requests_per_minute

    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            from app.core.redis_connector import get_redis

            redis_client = get_redis()
            client_ip = request.client.host if request.client else "unknown"
            window = int(time.time() // 60)
            key = f"rate_limit:{client_ip}:{window}"

            count = redis_client.incr(key)
            if count == 1:
                redis_client.expire(key, 60)

            if count > self.rpm:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Try again later."},
                )
        except Exception:
            # If Redis is unavailable, allow the request through
            pass

        return await call_next(request)
