"""
rate_limiter.py — Sliding-window rate limiter backed by Redis.

Design decision: if Redis is unavailable, the limiter defaults to ALLOW
(returns False) so that a Redis outage does not accidentally DoS your own
service. The failure is logged as a WARNING so it is visible in structured
logs without raising an exception that would break every request.
"""
import time
import logging
from app.core.redis import redis_client

_log = logging.getLogger(__name__)


def is_rate_limited(
    identifier: str,
    limit: int = 100,
    window_seconds: int = 60,
) -> bool:
    key = f"rate:{identifier}"
    now = time.time()
    window_start = now - window_seconds

    try:
        pipe = redis_client.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zcard(key)
        pipe.zadd(key, {str(now): now})
        pipe.expire(key, window_seconds)
        results = pipe.execute()

        request_count = results[1]
        return request_count >= limit

    except Exception as exc:
        # Redis is down — fail open (allow the request) to preserve availability.
        # Log at WARNING so ops teams can react, but don't crash the request.
        _log.warning(
            "rate_limiter pipeline failed — allowing request (fail-open)",
            extra={"identifier": identifier, "error": str(exc)},
        )
        return False
