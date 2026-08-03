"""
cache_service.py — Redis-backed URL and domain caching with graceful degradation.

If Redis is unavailable for any reason, all functions return safe fallback values
(None / no-op) so the application continues to work via Postgres fallback.
"""
import logging
from app.core.redis import redis_client

_log = logging.getLogger(__name__)

CACHE_TTL = 3600
DOMAIN_CACHE_TTL = 3600

# ─── URL cache ────────────────────────────────────────────────────────────────


def cache_url(short_code: str, original_url: str, url_id: int) -> None:
    try:
        redis_client.hset(f"url:{short_code}", mapping={
            "original_url": original_url,
            "url_id": str(url_id),
        })
        redis_client.expire(f"url:{short_code}", CACHE_TTL)
    except Exception as exc:  # pragma: no cover
        _log.warning(
            "cache_url failed — Redis unavailable, continuing without cache",
            extra={"short_code": short_code, "error": str(exc)},
        )


def get_cached_url(short_code: str) -> dict | None:
    try:
        data = redis_client.hgetall(f"url:{short_code}")
        if not data:
            return None
        return {
            "original_url": data["original_url"],
            "url_id": int(data["url_id"]),
        }
    except Exception as exc:  # pragma: no cover
        _log.warning(
            "get_cached_url failed — Redis unavailable, falling back to DB",
            extra={"short_code": short_code, "error": str(exc)},
        )
        return None


def invalidate_url(short_code: str) -> None:
    try:
        redis_client.delete(f"url:{short_code}")
    except Exception as exc:  # pragma: no cover
        _log.warning(
            "invalidate_url failed — Redis unavailable",
            extra={"short_code": short_code, "error": str(exc)},
        )

# ─── Custom domain cache ───────────────────────────────────────────────────────
# Key pattern: domain:{hostname}  →  owner_user_id (string)


def cache_domain(hostname: str, owner_user_id: int, ttl: int = DOMAIN_CACHE_TTL) -> None:
    try:
        redis_client.set(f"domain:{hostname}", str(owner_user_id), ex=ttl)
    except Exception as exc:  # pragma: no cover
        _log.warning(
            "cache_domain failed — Redis unavailable",
            extra={"hostname": hostname, "error": str(exc)},
        )


def get_cached_domain(hostname: str) -> int | None:
    try:
        value = redis_client.get(f"domain:{hostname}")
        return int(value) if value is not None else None
    except Exception as exc:  # pragma: no cover
        _log.warning(
            "get_cached_domain failed — Redis unavailable, falling back to DB",
            extra={"hostname": hostname, "error": str(exc)},
        )
        return None


def invalidate_domain(hostname: str) -> None:
    try:
        redis_client.delete(f"domain:{hostname}")
    except Exception as exc:  # pragma: no cover
        _log.warning(
            "invalidate_domain failed — Redis unavailable",
            extra={"hostname": hostname, "error": str(exc)},
        )
