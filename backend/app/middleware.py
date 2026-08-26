import asyncio
import json
import logging
import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings

logger = logging.getLogger("terpschedule.requests")


class RequestMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, deque[float]] = defaultdict(deque)
        self.lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        client = forwarded or (request.client.host if request.client else "unknown")
        limit = settings.OPTIMIZE_RATE_LIMIT_PER_MINUTE if request.url.path.endswith("/optimize") else settings.RATE_LIMIT_PER_MINUTE
        key = f"{client}:{request.url.path}"
        now = time.monotonic()
        async with self.lock:
            bucket = self.requests[key]
            while bucket and now - bucket[0] >= 60:
                bucket.popleft()
            if len(bucket) >= limit:
                return JSONResponse({"detail": "Too many requests. Please try again shortly."}, status_code=429, headers={"Retry-After": "60"})
            bucket.append(now)
        response = await call_next(request)
        logger.info(json.dumps({
            "event": "request",
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": round((time.perf_counter() - started) * 1000, 1),
        }))
        return response
