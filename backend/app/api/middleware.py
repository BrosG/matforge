"""Custom middleware for security, rate limiting, and request tracing."""

from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique request ID to every request/response for tracing."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log method, path, status, and latency for every request."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.monotonic()
        response = await call_next(request)
        elapsed_ms = (time.monotonic() - start) * 1000
        request_id = getattr(request.state, "request_id", "-")
        logger.info(
            "request_id=%s method=%s path=%s status=%d latency_ms=%.1f",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        response.headers["Cache-Control"] = (
            "no-store, no-cache, must-revalidate, max-age=0"
        )
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response


class _InMemoryRateLimiter:
    """Fallback rate limiter when Redis is unavailable.

    Uses a simple fixed-window counter per IP, protected by a lock.
    Automatically evicts stale windows to prevent unbounded memory growth.
    """

    def __init__(self) -> None:
        self._counts: dict[str, int] = defaultdict(int)
        self._windows: dict[str, int] = {}
        self._lock = Lock()

    def check(self, client_ip: str, window: int, limit: int) -> bool:
        """Return True if the request is allowed."""
        key = client_ip
        with self._lock:
            if self._windows.get(key) != window:
                self._windows[key] = window
                self._counts[key] = 0
                # Evict stale entries (older than 2 windows)
                stale = [k for k, w in self._windows.items() if w < window - 1]
                for k in stale:
                    self._windows.pop(k, None)
                    self._counts.pop(k, None)
            self._counts[key] += 1
            return self._counts[key] <= limit


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Fixed-window rate limiting with Redis primary, in-memory fallback.

    Never silently disables rate limiting. If Redis is unavailable, falls
    back to an in-memory counter so the service remains protected.
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.rpm = requests_per_minute
        self._fallback = _InMemoryRateLimiter()
        self._redis_warned = False

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for health checks
        if request.url.path.startswith("/health") or request.url.path.startswith(
            "/api/v1/health"
        ):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        window = int(time.time() // 60)

        allowed = self._check_redis(client_ip, window)
        if allowed is None:
            # Redis unavailable - use in-memory fallback
            if not self._redis_warned:
                logger.warning(
                    "Redis unavailable for rate limiting; using in-memory fallback"
                )
                self._redis_warned = True
            allowed = self._fallback.check(client_ip, window, self.rpm)
        else:
            self._redis_warned = False

        if not allowed:
            request_id = getattr(request.state, "request_id", "-")
            logger.warning(
                "request_id=%s rate_limit_exceeded ip=%s", request_id, client_ip
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
                headers={"Retry-After": "60"},
            )

        return await call_next(request)

    def _check_redis(self, client_ip: str, window: int) -> bool | None:
        """Try Redis. Returns True/False, or None if Redis is down."""
        try:
            from app.core.redis_connector import get_redis

            redis_client = get_redis()
            key = f"rate_limit:{client_ip}:{window}"
            count = redis_client.incr(key)
            if count == 1:
                redis_client.expire(key, 60)
            return count <= self.rpm
        except Exception:
            return None
